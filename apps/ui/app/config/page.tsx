'use client';

import { useEffect, useState } from 'react';
import type { MachineConfig, TaskType, BrainName } from '@/lib/types';

const TASK_TYPES: TaskType[] = ['dev', 'doc', 'sheet', 'slide'];
const BRAIN_NAMES: BrainName[] = [
  'claude-cli',
  'claude-sonnet-4-6',
  'claude-opus-4-7',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'llm-server',
];

type ConfigForm = Omit<MachineConfig, 'machine_id'> & {
  claude_api_key: string;
  gemini_api_key: string;
  notion_token: string;
  discord_token: string;
};

export default function ConfigPage() {
  const [form, setForm] = useState<ConfigForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = (await res.json()) as MachineConfig;
        setForm({
          machine_name: data.machine_name,
          accept_types: data.accept_types,
          brain: data.brain,
          notion_token: '',
          claude_api_key: '',
          gemini_api_key: '',
          discord_token: '',
          redis_url: data.redis_url,
          poll_interval: data.poll_interval,
          max_concurrent_tasks: data.max_concurrent_tasks,
        });
      } else {
        setError('Run `han init` first to create a config.');
      }
    })();
  }, []);

  const save = async () => {
    if (form === null) return;
    setSaving(true);
    setError(null);
    const patch: Partial<MachineConfig> = {
      machine_name: form.machine_name,
      accept_types: form.accept_types,
      brain: form.brain,
      redis_url: form.redis_url,
      poll_interval: form.poll_interval,
      max_concurrent_tasks: form.max_concurrent_tasks,
    };
    if (form.notion_token.length > 0) patch.notion_token = form.notion_token;
    if (form.claude_api_key.length > 0) patch.claude_api_key = form.claude_api_key;
    if (form.gemini_api_key.length > 0) patch.gemini_api_key = form.gemini_api_key;
    if (form.discord_token.length > 0) patch.discord_token = form.discord_token;

    const res = await fetch('/api/config', { method: 'PUT', body: JSON.stringify(patch), headers: { 'Content-Type': 'application/json' } });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError('Save failed');
    }
    setSaving(false);
  };

  if (error !== null && form === null) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }
  if (form === null) {
    return <p className="text-zinc-500 text-sm">Loading...</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-cyan-400 mb-6">Machine Config</h1>

      <div className="space-y-5 max-w-lg">
        <Field label="Machine Name">
          <Input value={form.machine_name} onChange={(v) => setForm({ ...form, machine_name: v })} />
        </Field>

        <Field label="Accept Task Types">
          <div className="flex gap-3 flex-wrap">
            {TASK_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.accept_types.includes(t)}
                  onChange={(e) => {
                    const types = e.target.checked
                      ? [...form.accept_types, t]
                      : form.accept_types.filter((x) => x !== t);
                    setForm({ ...form, accept_types: types });
                  }}
                  className="accent-cyan-400"
                />
                {t}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Default Brain">
          <select
            value={form.brain.default}
            onChange={(e) => setForm({ ...form, brain: { ...form.brain, default: e.target.value as BrainName } })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
          >
            {BRAIN_NAMES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>

        <Field label="Redis URL">
          <Input value={form.redis_url} onChange={(v) => setForm({ ...form, redis_url: v })} />
        </Field>

        <Field label="Poll Interval (seconds)">
          <Input
            value={String(form.poll_interval)}
            onChange={(v) => setForm({ ...form, poll_interval: Number(v) })}
            type="number"
          />
        </Field>

        <Field label="Max Concurrent Tasks">
          <Input
            value={String(form.max_concurrent_tasks)}
            onChange={(v) => setForm({ ...form, max_concurrent_tasks: Number(v) })}
            type="number"
          />
        </Field>

        <div className="border-t border-zinc-800 pt-5">
          <p className="text-xs text-zinc-500 mb-4">API Keys — ใส่เฉพาะถ้าต้องการอัปเดต (ไม่แสดงค่าเดิม)</p>

          <div className="space-y-4">
            <Field label="Notion API Key">
              <Input value={form.notion_token} onChange={(v) => setForm({ ...form, notion_token: v })} placeholder="secret_..." />
            </Field>
            <Field label="Claude API Key">
              <Input value={form.claude_api_key} onChange={(v) => setForm({ ...form, claude_api_key: v })} placeholder="sk-ant-..." />
            </Field>
            <Field label="Gemini API Key">
              <Input value={form.gemini_api_key} onChange={(v) => setForm({ ...form, gemini_api_key: v })} placeholder="AI..." />
            </Field>
            <Field label="Discord Bot Token">
              <Input value={form.discord_token} onChange={(v) => setForm({ ...form, discord_token: v })} placeholder="MT..." />
            </Field>
          </div>
        </div>

        {error !== null && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={() => void save()}
          disabled={saving}
          className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Config'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 placeholder-zinc-600"
    />
  );
}
