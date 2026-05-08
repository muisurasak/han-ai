import type { HanTask, MachineConfig } from '../types.js';
import type { ExecutorResult } from './index.js';
import { resolveBrain } from '../brains/router.js';

const SYSTEM_PROMPT = `You are Han AI — an autonomous dev agent.
You receive a task with a title and context, then complete it.
Be concise. Output your result as plain text or markdown.`;

export async function devExecutor(
  task: HanTask,
  config: MachineConfig,
): Promise<ExecutorResult> {
  const brain = resolveBrain(config, 'dev');

  const userPrompt = [
    `Task: ${task.title}`,
    task.context !== undefined ? `\nContext:\n${task.context}` : '',
  ].join('');

  const result = await brain.run({ systemPrompt: SYSTEM_PROMPT, userPrompt });

  return { brainUsed: result.brainUsed };
}
