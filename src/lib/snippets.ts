import { supabase } from './supabase';

export interface CodeSnippet {
  id: string;
  share_id: string;
  title: string;
  files: Record<string, string>;
  created_at: string;
  last_accessed: string | null;
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
  title = ''
): Promise<{ shortCode: string } | { error: string }> {
  const share_id = generateShareId();

  const { error } = await supabase
    .from('code_snippets')
    .insert({ share_id, title, files });

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

  supabase
    .from('code_snippets')
    .update({ last_accessed: new Date().toISOString() })
    .eq('share_id', shareId)
    .then(() => {});

  return data as CodeSnippet;
}
