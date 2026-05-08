'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProjectConfig } from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch('/api/projects');
    if (res.ok) setProjects((await res.json()) as ProjectConfig[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const remove = async (id: string) => {
    if (!confirm(`Delete project "${id}"?`)) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    void load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-cyan-400">Projects</h1>
        <Link
          href="/projects/new"
          className="text-sm px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-600 text-white transition-colors"
        >
          + New Project
        </Link>
      </div>

      {loading && <p className="text-zinc-500 text-sm">Loading...</p>}

      {!loading && projects.length === 0 && (
        <div className="rounded border border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
          No projects yet.{' '}
          <Link href="/projects/new" className="text-cyan-400 hover:underline">
            Create one
          </Link>
        </div>
      )}

      <div className="grid gap-3">
        {projects.map((p) => (
          <div
            key={p.project_id}
            className="rounded border border-zinc-800 bg-zinc-900/50 px-5 py-4 flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-sm mb-1">{p.project_name}</div>
              <div className="text-xs text-zinc-500">ID: {p.project_id}</div>
              <div className="text-xs text-zinc-500 mt-0.5">Notion DB: {p.notion_db_id}</div>
              {p.github_repo !== undefined && (
                <div className="text-xs text-zinc-500 mt-0.5">GitHub: {p.github_repo}</div>
              )}
            </div>
            <div className="flex gap-2 shrink-0 ml-4">
              <Link
                href={`/projects/${p.project_id}`}
                className="text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={() => void remove(p.project_id)}
                className="text-xs px-3 py-1.5 rounded border border-red-900 text-red-400 hover:bg-red-950/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
