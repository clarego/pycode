import { supabase } from './supabase';

export interface Snapshot {
  timestamp_ms: number;
  files: Record<string, string>;
  active_file: string;
  chars_added?: number;
  event?: string;
}

function generateShareId(length = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export async function saveSession(
  snapshots: Snapshot[],
  durationMs: number,
  activeFile: string,
  studentName: string
): Promise<{ shareId: string } | { error: string }> {
  const shareId = generateShareId();

  const { data: session, error: sessionError } = await supabase
    .from('coding_sessions')
    .insert({
      share_id: shareId,
      duration_ms: durationMs,
      active_file: activeFile,
      student_name: studentName,
    })
    .select('id')
    .maybeSingle();

  if (sessionError || !session) {
    return { error: sessionError?.message || 'Failed to create session' };
  }

  const BATCH_SIZE = 200;
  for (let i = 0; i < snapshots.length; i += BATCH_SIZE) {
    const batch = snapshots.slice(i, i + BATCH_SIZE).map((s) => ({
      session_id: session.id,
      timestamp_ms: s.timestamp_ms,
      files: s.files,
      active_file: s.active_file,
      chars_added: s.chars_added ?? 0,
      event: s.event ?? null,
    }));

    const { error: snapError } = await supabase
      .from('session_snapshots')
      .insert(batch);

    if (snapError) {
      return { error: snapError.message };
    }
  }

  return { shareId };
}

export async function loadSession(shareId: string) {
  const { data: session, error: sessionError } = await supabase
    .from('coding_sessions')
    .select('*')
    .eq('share_id', shareId)
    .maybeSingle();

  if (sessionError || !session) return null;

  const { data: snapshots, error: snapError } = await supabase
    .from('session_snapshots')
    .select('timestamp_ms, files, active_file, chars_added, event')
    .eq('session_id', session.id)
    .order('timestamp_ms', { ascending: true });

  if (snapError || !snapshots) return null;

  return {
    session,
    snapshots: snapshots as Snapshot[],
  };
}
