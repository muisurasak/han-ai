import fs from 'fs';
import os from 'os';
import path from 'path';
import type { MachineConfig, ProjectConfig } from './types';

const HAN_DIR = path.join(os.homedir(), '.han');
const CONFIG_PATH = path.join(HAN_DIR, 'config.json');
const PROJECTS_PATH = path.join(HAN_DIR, 'projects.json');

export function getMachineConfig(): MachineConfig | null {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as MachineConfig;
}

export function saveMachineConfig(config: MachineConfig): void {
  fs.mkdirSync(HAN_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getProjects(): ProjectConfig[] {
  if (!fs.existsSync(PROJECTS_PATH)) return [];
  return JSON.parse(fs.readFileSync(PROJECTS_PATH, 'utf-8')) as ProjectConfig[];
}

export function saveProject(project: ProjectConfig): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.project_id === project.project_id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  fs.mkdirSync(HAN_DIR, { recursive: true });
  fs.writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2));
}

export function deleteProject(projectId: string): void {
  const projects = getProjects().filter((p) => p.project_id !== projectId);
  fs.writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2));
}
