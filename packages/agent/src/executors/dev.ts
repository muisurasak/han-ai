import type { HanTask } from '../types.js';
import type { ExecutorResult } from './index.js';

/**
 * Dev executor — Phase 4 (placeholder สำหรับ MVP)
 * จะ implement: clone repo → branch → Claude เขียนโค้ด → push → PR
 */
export async function devExecutor(task: HanTask): Promise<ExecutorResult> {
  // TODO Phase 4: integrate TaskAgent from @orion/maw-engine + GitHub API
  throw new Error(`dev executor not implemented yet — task: ${task.title}`);
}
