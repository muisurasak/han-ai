import { Client, isFullPage } from '@notionhq/client';
import type {
  PageObjectResponse,
  UpdatePageParameters,
} from '@notionhq/client/build/src/api-endpoints.js';
import type { HanTask, TaskStatus, TaskUpdateExtra } from '../types.js';

type PageProps = PageObjectResponse['properties'];
type PropValue = PageProps[string];

export class NotionClient {
  private readonly client: Client;
  private readonly dbId: string;

  constructor(token: string, dbId: string) {
    this.client = new Client({ auth: token });
    this.dbId = dbId;
  }

  /** ดึง tasks ที่ status == Approve และ assigned_to == machineId หรือว่าง */
  async getApprovedTasks(machineId: string, acceptTypes: string[]): Promise<HanTask[]> {
    const response = await this.client.databases.query({
      database_id: this.dbId,
      filter: {
        and: [
          { property: 'status', select: { equals: 'Approve' } },
          { property: 'type', select: { is_not_empty: true } },
        ],
      },
      sorts: [{ property: 'priority', direction: 'ascending' }],
    });

    const tasks: HanTask[] = [];

    for (const page of response.results) {
      if (!isFullPage(page)) continue;
      const props = page.properties;

      const type = getSelect(props, 'type');
      if (type === null || !acceptTypes.includes(type)) continue;

      const assignedTo = getSelect(props, 'assigned_to');
      if (assignedTo !== null && assignedTo !== machineId) continue;

      const retryCount = getNumber(props, 'retry_count') ?? 0;
      if (retryCount >= 3) continue;

      const task: HanTask = {
        id: page.id.replace(/-/g, ''),
        notion_page_id: page.id,
        title: getTitle(props, 'title') ?? 'Untitled',
        type: type as HanTask['type'],
        status: 'Approve',
        priority: getNumber(props, 'priority') ?? 99,
        retry_count: retryCount,
      };

      const projectId = getSelect(props, 'project_id');
      if (projectId !== null) task.project_id = projectId;

      if (assignedTo !== null) task.assigned_to = assignedTo;

      const context = getRichText(props, 'context');
      if (context !== null) task.context = context;

      tasks.push(task);
    }

    return tasks;
  }

  /** อัปเดต status + optional fields */
  async updateStatus(pageId: string, status: TaskStatus, extra?: TaskUpdateExtra): Promise<void> {
    const properties: UpdatePageParameters['properties'] = {
      status: { select: { name: status } },
    };

    if (extra?.claimed_by !== undefined) {
      properties['claimed_by'] = { select: { name: extra.claimed_by } };
    }
    if (extra?.claimed_at !== undefined) {
      properties['claimed_at'] = { date: { start: extra.claimed_at } };
    }
    if (extra?.heartbeat_at !== undefined) {
      properties['heartbeat_at'] = { date: { start: extra.heartbeat_at } };
    }
    if (extra?.output_url !== undefined) {
      properties['output_url'] = { url: extra.output_url };
    }
    if (extra?.error_log !== undefined) {
      properties['error_log'] = {
        rich_text: [{ type: 'text', text: { content: extra.error_log } }],
      };
    }
    if (extra?.brain_used !== undefined) {
      properties['brain_used'] = { select: { name: extra.brain_used } };
    }
    if (extra?.retry_count !== undefined) {
      properties['retry_count'] = { number: extra.retry_count };
    }

    await this.client.pages.update({ page_id: pageId, properties });
  }

  /** Heartbeat ping — ต่ออายุ task ไม่ให้ถูก watchdog reset */
  async updateHeartbeat(pageId: string): Promise<void> {
    await this.client.pages.update({
      page_id: pageId,
      properties: { heartbeat_at: { date: { start: new Date().toISOString() } } },
    });
  }
}

// ─── Pure helper functions (type-safe via discriminated union) ────────────────

function getTitle(props: PageProps, key: string): string | null {
  const prop: PropValue | undefined = props[key];
  if (prop?.type === 'title' && prop.title.length > 0) {
    return prop.title[0]?.plain_text ?? null;
  }
  return null;
}

function getSelect(props: PageProps, key: string): string | null {
  const prop: PropValue | undefined = props[key];
  if (prop?.type === 'select') return prop.select?.name ?? null;
  return null;
}

function getNumber(props: PageProps, key: string): number | null {
  const prop: PropValue | undefined = props[key];
  if (prop?.type === 'number') return prop.number;
  return null;
}

function getRichText(props: PageProps, key: string): string | null {
  const prop: PropValue | undefined = props[key];
  if (prop?.type === 'rich_text' && prop.rich_text.length > 0) {
    return prop.rich_text[0]?.plain_text ?? null;
  }
  return null;
}
