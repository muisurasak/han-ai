import type { Redis as IORedis } from 'ioredis';
import type { MachineInfo, TaskType } from '../types.js';

const REGISTRY_KEY = 'han:registry';
const HEARTBEAT_INTERVAL_MS = 30_000;
const OFFLINE_THRESHOLD_MS = 120_000; // 2 นาที

export class MachineRegistry {
  private redis: IORedis;
  private machineId: string;
  private machineName: string;
  private acceptTypes: TaskType[];
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(redis: IORedis, machineId: string, machineName: string, acceptTypes: TaskType[]) {
    this.redis = redis;
    this.machineId = machineId;
    this.machineName = machineName;
    this.acceptTypes = acceptTypes;
  }

  /** Register เครื่องนี้เข้า registry และเริ่ม heartbeat */
  async register(): Promise<void> {
    await this.ping();
    this.heartbeatTimer = setInterval(() => this.ping(), HEARTBEAT_INTERVAL_MS);
  }

  async unregister(): Promise<void> {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    const info: MachineInfo = {
      machine_id: this.machineId,
      machine_name: this.machineName,
      status: 'offline',
      last_seen: Date.now(),
      accept_types: this.acceptTypes,
    };
    await this.redis.hset(REGISTRY_KEY, this.machineId, JSON.stringify(info));
  }

  async setCurrentTask(taskId: string | undefined): Promise<void> {
    const raw = await this.redis.hget(REGISTRY_KEY, this.machineId);
    if (!raw) return;
    const info = JSON.parse(raw) as MachineInfo;
    info.current_task = taskId;
    await this.redis.hset(REGISTRY_KEY, this.machineId, JSON.stringify(info));
  }

  async listAll(): Promise<MachineInfo[]> {
    const all = await this.redis.hgetall(REGISTRY_KEY);
    const now = Date.now();
    return Object.values(all).map((raw) => {
      const info = JSON.parse(raw as string) as MachineInfo;
      info.status = now - info.last_seen > OFFLINE_THRESHOLD_MS ? 'offline' : 'online';
      return info;
    });
  }

  private async ping(currentTask?: string): Promise<void> {
    const info: MachineInfo = {
      machine_id: this.machineId,
      machine_name: this.machineName,
      status: 'online',
      last_seen: Date.now(),
      accept_types: this.acceptTypes,
      current_task: currentTask,
    };
    await this.redis.hset(REGISTRY_KEY, this.machineId, JSON.stringify(info));
  }
}
