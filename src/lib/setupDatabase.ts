import { supabase } from './supabase';

let setupAttempted = false;

export async function ensureDatabase(): Promise<void> {
  if (setupAttempted) return;
  setupAttempted = true;

  try {
    const { error } = await supabase
      .from('code_snippets')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.warn(
        'The code_snippets table does not exist. Please run the migration SQL in the Supabase dashboard.'
      );
    }
  } catch {
    // silently handle
  }
}
