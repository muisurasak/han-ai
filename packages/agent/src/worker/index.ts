import chalk from 'chalk';
import { getMachineConfig, getProjects } from '../config.js';
import { NotionClient } from '../integrations/notion.js';
import { RedisLock } from './redis-lock.js';
import { MachineRegistry } from './machine-registry.js';
import { executeTask } from '../executors/index.js';
import type { HanTask } from '../types.js';

const MIN_POLL_MS = 30_000;
const MAX_POLL_MS = 120_000;

/** Start the polling worker loop — runs until SIGINT/SIGTERM */
export async function startWorker(): Promise<void> {
  const config = getMachineConfig();
  if (config === null) {
    console.error(chalk.red('❌ ยังไม่ได้ config — รัน `han init` ก่อน'));
    process.exit(1);
  }

  const projects = getProjects();
  if (projects.length === 0) {
    console.error(chalk.red('❌ ยังไม่มี project — สร้าง project ก่อนที่ han UI'));
    process.exit(1);
  }

  console.log(chalk.cyan(`🤖 Han Agent starting — machine: ${config.machine_name}`));
  console.log(chalk.gray(`   accept_types: ${config.accept_types.join(', ')}`));
  console.log(chalk.gray(`   redis: ${config.redis_url}`));

  const lock = new RedisLock(config.redis_url, config.machine_id);
  await lock.connect();

  const registry = new MachineRegistry(
    lock.getRedis(),
    config.machine_id,
    config.machine_name,
    config.accept_types,
  );
  await registry.register();

  const notionClients = projects.map((p) => ({
    project: p,
    client: new NotionClient(config.notion_token, p.notion_db_id),
  }));

  let activeTasks = 0;
  let pollInterval = MIN_POLL_MS;

  const shutdown = async (): Promise<void> => {
    console.log(chalk.yellow('\n👋 Shutting down...'));
    await registry.unregister();
    await lock.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  console.log(chalk.green(`✅ Worker ready — polling every ${MIN_POLL_MS / 1000}s`));

  while (true) {
    if (activeTasks >= config.max_concurrent_tasks) {
      await sleep(pollInterval);
      continue;
    }

    let foundTask = false;

    outer: for (const { project: _project, client } of notionClients) {
      const tasks = await client.getApprovedTasks(config.machine_id, config.accept_types);

      for (const task of tasks) {
        const claimed = await lock.claim(task.id);
        if (!claimed) continue;

        foundTask = true;
        activeTasks++;

        void runTask(task, client, lock, registry, config.machine_id).finally(() => {
          activeTasks--;
        });

        break outer;
      }
    }

    pollInterval = foundTask
      ? MIN_POLL_MS
      : Math.min(pollInterval * 1.5, MAX_POLL_MS);

    if (!foundTask) {
      process.stdout.write(
        chalk.gray(`\r⏳ No tasks — next poll in ${Math.round(pollInterval / 1000)}s `),
      );
    }

    await sleep(pollInterval);
  }
}

async function runTask(
  task: HanTask,
  notion: NotionClient,
  lock: RedisLock,
  registry: MachineRegistry,
  machineId: string,
): Promise<void> {
  console.log(chalk.cyan(`\n▶ [${task.type.toUpperCase()}] ${task.title}`));

  await notion.updateStatus(task.notion_page_id, 'In-Progress', {
    claimed_by: machineId,
    claimed_at: new Date().toISOString(),
  });
  await registry.setCurrentTask(task.id);

  try {
    const result = await executeTask(task);

    await notion.updateStatus(task.notion_page_id, 'Done', {
      ...(result.outputUrl !== undefined && { output_url: result.outputUrl }),
      ...(result.brainUsed !== undefined && { brain_used: result.brainUsed }),
    });

    console.log(chalk.green(`✅ Done: ${task.title}`));
    if (result.outputUrl !== undefined) {
      console.log(chalk.gray(`   → ${result.outputUrl}`));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const retryCount = task.retry_count + 1;
    const newStatus = retryCount >= 3 ? 'Failed' : 'Approve';

    await notion.updateStatus(task.notion_page_id, newStatus, {
      error_log: msg,
      retry_count: retryCount,
    });

    console.error(chalk.red(`❌ Failed: ${task.title} — ${msg}`));
    if (newStatus === 'Failed') {
      console.error(chalk.red('   Max retries reached → Failed'));
    }
  } finally {
    await lock.release(task.id);
    await registry.setCurrentTask(undefined);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
