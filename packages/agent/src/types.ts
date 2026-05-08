export type TaskType = 'dev' | 'doc' | 'sheet' | 'slide';
export type TaskStatus = 'New' | 'Approve' | 'In-Progress' | 'Done' | 'Failed';
export type BrainName =
  | 'claude-cli'        // spawn `claude` binary — ไม่ต้องใช้ API key
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-7'
  | 'gemini-2.5-pro'
  | 'gemini-2.0-flash'
  | 'llm-server';       // POST ไปที่ llm_server_url

export interface BrainConfig {
  default: BrainName;
  dev?: BrainName;
  doc?: BrainName;
  sheet?: BrainName;
  slide?: BrainName;
}

export interface MachineConfig {
  machine_id: string;
  machine_name: string;
  accept_types: TaskType[];
  brain: BrainConfig;
  notion_token: string;
  claude_api_key?: string;
  gemini_api_key?: string;
  discord_token?: string;
  discord_channel_id?: string;
  llm_server_url?: string;
  redis_url: string;
  poll_interval: number;
  max_concurrent_tasks: number;
}

export interface ProjectConfig {
  project_id: string;
  project_name: string;
  notion_db_id: string;
  github_repo?: string;
  google_drive_folder_id?: string;
  discord_channel_id?: string;
  brain_override?: Partial<BrainConfig>;
}

export interface HanTask {
  id: string;
  notion_page_id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: number;
  retry_count: number;
  project_id?: string;
  assigned_to?: string;
  claimed_by?: string;
  claimed_at?: string;
  heartbeat_at?: string;
  output_url?: string;
  error_log?: string;
  brain_used?: string;
  context?: string;
}

export interface MachineInfo {
  machine_id: string;
  machine_name: string;
  status: 'online' | 'offline';
  last_seen: number;
  accept_types: TaskType[];
  current_task?: string;
}

export interface TaskUpdateExtra {
  claimed_by?: string;
  claimed_at?: string;
  heartbeat_at?: string;
  output_url?: string;
  error_log?: string;
  brain_used?: string;
  retry_count?: number;
}
