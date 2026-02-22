import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const STANDALONE_SUPABASE_URL = 'https://qfitpwdrswvnbmzvkoyd.supabase.co';
const STANDALONE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE';

export interface AuthUser {
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  apiKey: string;
  loading: boolean;
  initialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function clearAuthCache() {
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_api_key');
  localStorage.removeItem('pyplayground_openai_key');
  localStorage.removeItem('pyplayground_openai_key_valid');
}

async function validateAuthToken(
  token: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ username: string; isAdmin: boolean } | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/auth_tokens?token=eq.${encodeURIComponent(token)}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin,expires_at`,
      {
        headers: {
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      }
    );
    const tokens = await response.json();
    if (Array.isArray(tokens) && tokens.length > 0) {
      return { username: tokens[0].username, isAdmin: tokens[0].is_admin };
    }
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const initRan = useRef(false);

  const logout = useCallback(() => {
    clearAuthCache();
    setUser(null);
    setApiKey('');
  }, []);

  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;

    const cachedUser = localStorage.getItem('auth_user');
    const cachedKey = localStorage.getItem('auth_api_key');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
        setApiKey(cachedKey || '');
        setLoading(false);
        setInitialized(true);
        return;
      } catch {
        clearAuthCache();
      }
    }

    if (isInIframe()) {
      attemptIframeLogin();
    } else {
      setLoading(false);
      setInitialized(true);
    }

    function attemptIframeLogin() {
      window.parent.postMessage({ type: 'REQUEST_API_VALUES' }, '*');

      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type !== 'API_VALUES_RESPONSE') return;
        window.removeEventListener('message', handleMessage);
        clearTimeout(timer);

        const {
          authToken,
          SUPABASE_URL,
          SUPABASE_ANON_KEY,
          OPENAI_API_KEY,
          username,
          isAdmin,
        } = event.data.data || {};

        let resolvedUser: AuthUser | null = null;
        let resolvedKey = OPENAI_API_KEY || '';

        if (authToken && SUPABASE_URL && SUPABASE_ANON_KEY) {
          const validated = await validateAuthToken(authToken, SUPABASE_URL, SUPABASE_ANON_KEY);
          if (validated) {
            resolvedUser = validated;
          }
        }

        if (!resolvedUser && username) {
          resolvedUser = { username, isAdmin: !!isAdmin };
        }

        if (resolvedUser) {
          localStorage.setItem('auth_user', JSON.stringify(resolvedUser));
          localStorage.setItem('auth_api_key', resolvedKey);
          setUser(resolvedUser);
          setApiKey(resolvedKey);
        }

        setLoading(false);
        setInitialized(true);
      };

      window.addEventListener('message', handleMessage);

      const timer = setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        setLoading(false);
        setInitialized(true);
      }, 2000);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const supabase = createClient(STANDALONE_SUPABASE_URL, STANDALONE_ANON_KEY);

    const { data: userRow } = await supabase
      .from('users_login')
      .select('username, password, is_admin')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (!userRow) throw new Error('Invalid username or password');

    const { data: secretRow } = await supabase
      .from('secrets')
      .select('key_value')
      .eq('key_name', 'OPENAI_API_KEY')
      .maybeSingle();

    const resolvedKey = secretRow?.key_value || '';
    const authUser: AuthUser = { username, isAdmin: userRow.is_admin === true };

    localStorage.setItem('auth_user', JSON.stringify(authUser));
    localStorage.setItem('auth_api_key', resolvedKey);
    setUser(authUser);
    setApiKey(resolvedKey);
  }, []);

  return (
    <AuthContext.Provider value={{ user, apiKey, loading, initialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
