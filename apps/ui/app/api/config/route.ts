import { NextResponse } from 'next/server';
import { getMachineConfig, saveMachineConfig } from '@/lib/config';
import type { MachineConfig } from '@/lib/types';

export function GET() {
  const config = getMachineConfig();
  if (config === null) {
    return NextResponse.json({ error: 'No config found' }, { status: 404 });
  }
  // ไม่ส่ง API keys ออก
  const safe = { ...config, claude_api_key: undefined, gemini_api_key: undefined, notion_token: undefined, discord_token: undefined };
  return NextResponse.json(safe);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<MachineConfig>;
  const existing = getMachineConfig();
  if (existing === null) {
    return NextResponse.json({ error: 'Run `han init` first' }, { status: 400 });
  }
  const updated: MachineConfig = {
    ...existing,
    ...body,
    machine_id: existing.machine_id, // ห้ามเปลี่ยน
  };
  saveMachineConfig(updated);
  return NextResponse.json({ ok: true });
}
