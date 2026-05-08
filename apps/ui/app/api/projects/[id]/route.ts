import { NextResponse } from 'next/server';
import { getProjects, saveProject, deleteProject } from '@/lib/config';
import type { ProjectConfig } from '@/lib/types';

export function GET(_req: Request, { params }: { params: { id: string } }) {
  const project = getProjects().find((p) => p.project_id === params.id);
  if (project === undefined) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = (await request.json()) as Partial<ProjectConfig>;
  const existing = getProjects().find((p) => p.project_id === params.id);
  if (existing === undefined) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  saveProject({ ...existing, ...body, project_id: params.id });
  return NextResponse.json({ ok: true });
}

export function DELETE(_req: Request, { params }: { params: { id: string } }) {
  deleteProject(params.id);
  return NextResponse.json({ ok: true });
}
