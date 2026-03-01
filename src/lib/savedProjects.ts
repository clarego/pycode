import { supabase } from './supabase';

export interface SavedProject {
  id: string;
  username: string;
  name: string;
  files: Record<string, string>;
  active_file: string;
  created_at: string;
  updated_at: string;
}

export async function listSavedProjects(username: string): Promise<SavedProject[]> {
  const { data, error } = await supabase
    .from('saved_projects')
    .select('*')
    .eq('username', username)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SavedProject[];
}

export async function saveProject(
  username: string,
  name: string,
  files: Record<string, string>,
  activeFile: string,
  existingId?: string
): Promise<SavedProject> {
  if (existingId) {
    const { data, error } = await supabase
      .from('saved_projects')
      .update({ name, files, active_file: activeFile, updated_at: new Date().toISOString() })
      .eq('id', existingId)
      .eq('username', username)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as SavedProject;
  }

  const { data, error } = await supabase
    .from('saved_projects')
    .insert({ username, name, files, active_file: activeFile })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SavedProject;
}

export async function deleteProject(username: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('saved_projects')
    .delete()
    .eq('id', id)
    .eq('username', username);
  if (error) throw new Error(error.message);
}
