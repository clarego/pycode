import { supabase } from './supabase';

export interface SavedProject {
  id: string;
  username: string;
  name: string;
  files: Record<string, string>;
  binary_files: Record<string, string>;
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

async function uploadBinaryFiles(
  username: string,
  projectId: string,
  binaryFiles: Record<string, string>
): Promise<Record<string, string>> {
  const paths: Record<string, string> = {};

  for (const [filename, dataUrl] of Object.entries(binaryFiles)) {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    const byteChars = atob(base64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: mime });

    const storagePath = `${username}/${projectId}/${filename}`;
    const { error } = await supabase.storage
      .from('project-files')
      .upload(storagePath, blob, { upsert: true, contentType: mime });

    if (!error) {
      paths[filename] = storagePath;
    }
  }

  return paths;
}

export async function loadBinaryFiles(
  storagePaths: Record<string, string>
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  for (const [filename, path] of Object.entries(storagePaths)) {
    const { data, error } = await supabase.storage
      .from('project-files')
      .createSignedUrl(path, 3600);

    if (!error && data?.signedUrl) {
      result[filename] = data.signedUrl;
    }
  }

  return result;
}

export async function saveProject(
  username: string,
  name: string,
  files: Record<string, string>,
  activeFile: string,
  existingId?: string,
  binaryFiles?: Record<string, string>
): Promise<SavedProject> {
  const projectId = existingId ?? crypto.randomUUID();

  let binaryFilePaths: Record<string, string> = {};
  if (binaryFiles && Object.keys(binaryFiles).length > 0) {
    binaryFilePaths = await uploadBinaryFiles(username, projectId, binaryFiles);
  }

  if (existingId) {
    const { data, error } = await supabase
      .from('saved_projects')
      .update({
        name,
        files,
        active_file: activeFile,
        binary_files: binaryFilePaths,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingId)
      .eq('username', username)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as SavedProject;
  }

  const { data, error } = await supabase
    .from('saved_projects')
    .insert({ id: projectId, username, name, files, active_file: activeFile, binary_files: binaryFilePaths })
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

  const { data: files } = await supabase.storage
    .from('project-files')
    .list(`${username}/${id}`);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${username}/${id}/${f.name}`);
    await supabase.storage.from('project-files').remove(paths);
  }
}
