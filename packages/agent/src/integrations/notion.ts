import { Client } from '@notionhq/client';
import type { HanTask, TaskStatus } from '../types.js';

export class NotionClient {
  private client: Client;
  private dbId: string;

  constructor(token: string, dbId: string) {
    this.client = new Client({ auth: token });
    this.dbId = dbId;
  }

  /** ดึง tasks ที่ status == Approve และ assigned_to == machineId หรือ null */
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
      if (!('properties' in page)) continue;
      const props = page.properties;

      const type = this.getPropSelect(props, 'type');
      if (!type || !acceptTypes.includes(type)) continue;

      const assignedTo = this.getPropSelect(props, 'assigned_to');
      if (assignedTo && assignedTo !== machineId) continue;

      const retryCount = this.getPropNumber(props, 'retry_count') ?? 0;
      if (retryCount >= 3) continue;

      tasks.push({
        id: page.id.replace(/-/g, ''),
        notion_page_id: page.id,
        title: this.getPropTitle(props, 'title') ?? 'Untitled',
        type: type as HanTask['type'],
        status: 'Approve',
        priority: this.getPropNumber(props, 'priority') ?? 99,
        project_id: this.getPropSelect(props, 'project_id') ?? undefined,
        assigned_to: assignedTo ?? undefined,
        retry_count: retryCount,
        context: this.getPropText(props, 'context') ?? undefined,
      });
    }

    return tasks;
  }

  async updateStatus(pageId: string, status: TaskStatus, extra?: Partial<{
    claimed_by: string;
    claimed_at: string;
    heartbeat_at: string;
    output_url: string;
    error_log: string;
    brain_used: string;
    retry_count: number;
  }>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const properties: Record<string, any> = {
      status: { select: { name: status } },
    };

    if (extra?.claimed_by) properties['claimed_by'] = { select: { name: extra.claimed_by } };
    if (extra?.claimed_at) properties['claimed_at'] = { date: { start: extra.claimed_at } };
    if (extra?.heartbeat_at) properties['heartbeat_at'] = { date: { start: extra.heartbeat_at } };
    if (extra?.output_url) properties['output_url'] = { url: extra.output_url };
    if (extra?.error_log) properties['error_log'] = { rich_text: [{ text: { content: extra.error_log } }] };
    if (extra?.brain_used) properties['brain_used'] = { select: { name: extra.brain_used } };
    if (extra?.retry_count !== undefined) properties['retry_count'] = { number: extra.retry_count };

    await this.client.pages.update({ page_id: pageId, properties });
  }

  async updateHeartbeat(pageId: string): Promise<void> {
    await this.client.pages.update({
      page_id: pageId,
      properties: {
        heartbeat_at: { date: { start: new Date().toISOString() } },
      },
    });
  }

  private getPropTitle(props: Record<string, unknown>, key: string): string | null {
    const prop = props[key] as { type: string; title?: { plain_text: string }[] } | undefined;
    if (prop?.type === 'title' && prop.title?.length) return prop.title[0]?.plain_text ?? null;
    return null;
  }

  private getPropSelect(props: Record<string, unknown>, key: string): string | null {
    const prop = props[key] as { type: string; select?: { name: string } | null } | undefined;
    if (prop?.type === 'select') return prop.select?.name ?? null;
    return null;
  }

  private getPropNumber(props: Record<string, unknown>, key: string): number | null {
    const prop = props[key] as { type: string; number?: number | null } | undefined;
    if (prop?.type === 'number') return prop.number ?? null;
    return null;
  }

  private getPropText(props: Record<string, unknown>, key: string): string | null {
    const prop = props[key] as { type: string; rich_text?: { plain_text: string }[] } | undefined;
    if (prop?.type === 'rich_text' && prop.rich_text?.length) return prop.rich_text[0]?.plain_text ?? null;
    return null;
  }
}
