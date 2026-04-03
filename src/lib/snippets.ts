import { supabase } from './supabase';

export interface CodeSnippet {
  id: string;
  share_id: string;
  title: string;
  description: string;
  files: Record<string, string>;
  binary_files: Record<string, string>;
  active_file: string | null;
  created_at: string;
  last_accessed: string | null;
  created_by: string | null;
  is_public: boolean;
}

function generateShareId(length = 7): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export async function saveSnippet(
  files: Record<string, string>,
  title = '',
  binaryFiles?: Record<string, string>,
  activeFile?: string,
  username?: string
): Promise<{ shortCode: string } | { error: string }> {
  const share_id = generateShareId();

  const { error } = await supabase
    .from('code_snippets')
    .insert({
      share_id,
      title,
      files,
      binary_files: binaryFiles || {},
      active_file: activeFile || null,
      created_by: username || null,
      is_public: true,
    });

  if (error) {
    return { error: error.message };
  }

  return { shortCode: share_id };
}

export async function loadSnippet(
  shareId: string
): Promise<CodeSnippet | null> {
  const { data, error } = await supabase
    .from('code_snippets')
    .select('*')
    .eq('share_id', shareId)
    .maybeSingle();

  if (error || !data) return null;

  if (!data.is_public) return null;

  supabase
    .from('code_snippets')
    .update({ last_accessed: new Date().toISOString() })
    .eq('share_id', shareId)
    .then(() => {});

  return data as CodeSnippet;
}

export async function deleteSnippet(
  shareId: string,
  username: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('code_snippets')
    .delete()
    .eq('share_id', shareId)
    .eq('created_by', username);

  if (error) return { error: error.message };
  return {};
}

export async function unshareSnippet(
  shareId: string,
  username: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('code_snippets')
    .update({ is_public: false })
    .eq('share_id', shareId)
    .eq('created_by', username);

  if (error) return { error: error.message };
  return {};
}

export async function reshareSnippet(
  shareId: string,
  username: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('code_snippets')
    .update({ is_public: true })
    .eq('share_id', shareId)
    .eq('created_by', username);

  if (error) return { error: error.message };
  return {};
}

export async function getMySnippets(
  username: string
): Promise<CodeSnippet[]> {
  const { data, error } = await supabase
    .from('code_snippets')
    .select('*')
    .eq('created_by', username)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as CodeSnippet[];
}

export async function getAllSnippets(): Promise<CodeSnippet[]> {
  const { data, error } = await supabase
    .from('code_snippets')
    .select('*')
    .not('created_by', 'is', null)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as CodeSnippet[];
}

export async function adminUpdateSnippet(
  shareId: string,
  updates: { description?: string; is_public?: boolean }
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('code_snippets')
    .update(updates)
    .eq('share_id', shareId);

  if (error) return { error: error.message };
  return {};
}

export async function adminDeleteSnippet(
  shareId: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('code_snippets')
    .delete()
    .eq('share_id', shareId);

  if (error) return { error: error.message };
  return {};
}
