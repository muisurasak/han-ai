import fs from 'fs';
import os from 'os';
import path from 'path';
import type { MachineConfig, ProjectConfig } from './types.js';

const CONFIG_DIR = path.join(os.homedir(), '.han');
const MACHINE_CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const PROJECTS_CONFIG_PATH = path.join(CONFIG_DIR, 'projects.json');

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getMachineConfig(): MachineConfig | null {
  if (!fs.existsSync(MACHINE_CONFIG_PATH)) return null;
  const raw = fs.readFileSync(MACHINE_CONFIG_PATH, 'utf-8');
  return JSON.parse(raw) as MachineConfig;
}

export function saveMachineConfig(config: MachineConfig): void {
  ensureConfigDir();
  fs.writeFileSync(MACHINE_CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getProjects(): ProjectConfig[] {
  if (!fs.existsSync(PROJECTS_CONFIG_PATH)) return [];
  const raw = fs.readFileSync(PROJECTS_CONFIG_PATH, 'utf-8');
  return JSON.parse(raw) as ProjectConfig[];
}

export function saveProject(project: ProjectConfig): void {
  ensureConfigDir();
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.project_id === project.project_id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  fs.writeFileSync(PROJECTS_CONFIG_PATH, JSON.stringify(projects, null, 2));
}

export function deleteProject(projectId: string): void {
  const projects = getProjects().filter((p) => p.project_id !== projectId);
  ensureConfigDir();
  fs.writeFileSync(PROJECTS_CONFIG_PATH, JSON.stringify(projects, null, 2));
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
