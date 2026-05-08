'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MachineInfo } from '@/lib/types';

export default function StatusPage() {
  const [machines, setMachines] = useState<MachineInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/machines');
        if (!res.ok) throw new Error('Failed to fetch');
        setMachines((await res.json()) as MachineInfo[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    void load();
    const interval = setInterval(() => void load(), 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-cyan-400">Machine Status</h1>
        <span className="text-xs text-zinc-500">auto-refresh 10s</span>
      </div>

      {loading && <p className="text-zinc-500 text-sm">Loading...</p>}
      {error !== null && (
        <div className="rounded border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error} — is Redis running?
        </div>
      )}

      {!loading && machines.length === 0 && error === null && (
        <div className="rounded border border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
          No machines registered. Run <code className="text-cyan-400">han start</code> on a machine.
        </div>
      )}

      <div className="grid gap-3">
        {machines.map((m) => (
          <div
            key={m.machine_id}
            className="rounded border border-zinc-800 bg-zinc-900/50 px-5 py-4 flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    m.status === 'online' ? 'bg-green-400' : 'bg-zinc-600'
                  }`}
                />
                <span className="font-bold text-sm">{m.machine_name}</span>
                <span className="text-xs text-zinc-500">{m.machine_id}</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                types: {m.accept_types.join(', ')}
              </div>
              {m.current_task !== undefined && (
                <div className="text-xs text-yellow-400 mt-1">
                  working on: {m.current_task}
                </div>
              )}
            </div>
            <div className="text-right">
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  m.status === 'online'
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {m.status}
              </span>
              <div className="text-xs text-zinc-600 mt-1">
                seen {Math.round((Date.now() - m.last_seen) / 1000)}s ago
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/projects"
          className="text-sm px-4 py-2 rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
        >
          Manage Projects →
        </Link>
        <Link
          href="/config"
          className="text-sm px-4 py-2 rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
        >
          Machine Config →
        </Link>
      </div>
    </div>
  );
}
