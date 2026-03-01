import { supabase } from './supabase';

export interface ProgressRow {
  username: string;
  module_id: string;
  task_id: string;
  task_index: number;
  completed_at: string;
}

export async function markTaskComplete(username: string, moduleId: string, taskId: string, taskIndex: number): Promise<void> {
  await supabase
    .from('module_progress')
    .upsert({ username, module_id: moduleId, task_id: taskId, task_index: taskIndex }, { onConflict: 'username,task_id' });

  const existing = JSON.parse(localStorage.getItem('pycode_completed_tasks') || '{}');
  existing[`${moduleId}-${taskIndex}`] = true;
  localStorage.setItem('pycode_completed_tasks', JSON.stringify(existing));
  window.dispatchEvent(new Event('pycode_progress_update'));
}

export async function loadUserProgress(username: string): Promise<Record<string, boolean>> {
  const { data } = await supabase
    .from('module_progress')
    .select('module_id, task_index')
    .eq('username', username);

  const map: Record<string, boolean> = {};
  for (const row of data || []) {
    map[`${row.module_id}-${row.task_index}`] = true;
  }
  return map;
}

export async function loadAllUsersProgress(): Promise<ProgressRow[]> {
  const { data } = await supabase
    .from('module_progress')
    .select('username, module_id, task_id, task_index, completed_at')
    .order('completed_at', { ascending: false });
  return data || [];
}

export async function loadAllUsersProgressSummary(): Promise<{ username: string; total: number; by_module: Record<string, number> }[]> {
  const { data } = await supabase
    .from('module_progress')
    .select('username, module_id');

  if (!data) return [];

  const map: Record<string, { total: number; by_module: Record<string, number> }> = {};
  for (const row of data) {
    if (!map[row.username]) map[row.username] = { total: 0, by_module: {} };
    map[row.username].total++;
    map[row.username].by_module[row.module_id] = (map[row.username].by_module[row.module_id] || 0) + 1;
  }
  return Object.entries(map).map(([username, v]) => ({ username, ...v }));
}
