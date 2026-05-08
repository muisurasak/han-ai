import type { HanTask, MachineConfig, ProjectConfig } from '../types.js';
import { devExecutor } from './dev.js';

export interface ExecutorResult {
  outputUrl?: string;
  brainUsed?: string;
}

export async function executeTask(
  task: HanTask,
  config: MachineConfig,
  project: ProjectConfig,
): Promise<ExecutorResult> {
  switch (task.type) {
    case 'dev':
      return devExecutor(task, config, project);
    case 'doc':
    case 'sheet':
    case 'slide':
      throw new Error(`Executor for type '${task.type}' not implemented yet`);
    default:
      throw new Error(`Unknown task type: ${task.type}`);
  }
}
