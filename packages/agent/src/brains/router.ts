import type { MachineConfig, TaskType, BrainName } from '../types.js';
import type { Brain } from './types.js';
import { ClaudeCliBrain } from './claude-cli.js';
import { LLMServerBrain } from './llm-server.js';

/** เลือก brain ตาม task type — ดู per-type override ก่อน แล้ว fallback ไป default */
export function resolveBrain(config: MachineConfig, taskType: TaskType): Brain {
  const brainName: BrainName = config.brain[taskType] ?? config.brain.default;
  return createBrain(brainName, config);
}

function createBrain(name: BrainName, config: MachineConfig): Brain {
  switch (name) {
    case 'claude-cli':
      return new ClaudeCliBrain({ model: 'sonnet' });

    case 'claude-sonnet-4-6':
      return new ClaudeCliBrain({ model: 'claude-sonnet-4-6' });

    case 'claude-opus-4-7':
      return new ClaudeCliBrain({ model: 'claude-opus-4-7' });

    case 'gemini-2.5-pro':
    case 'gemini-2.0-flash':
      // Phase 3 extension point — fallback ไป claude-cli ก่อน
      return new ClaudeCliBrain({ model: 'sonnet' });

    case 'llm-server': {
      const url = config.llm_server_url;
      if (url === undefined) throw new Error('llm_server_url not configured');
      return new LLMServerBrain(url);
    }
  }
}

export type { Brain, BrainRequest, BrainResponse } from './types.js';
