import { NextResponse } from 'next/server';
import { getMachineConfig } from '@/lib/config';
import { getMachines } from '@/lib/registry';

export async function GET() {
  const config = getMachineConfig();
  if (config === null) {
    return NextResponse.json([]);
  }
  const machines = await getMachines(config.redis_url);
  return NextResponse.json(machines);
}
