import { supabase } from './supabase';

export const MANAGER_EMAIL = 'mohamedghazawy04@gmail.com';
export const ALLOWED_MANAGER_EMAILS = [
  'mohamedghazawy04@gmail.com',
  'mohamedgedo360@yahoo.com',
  'mohamedhgas4444@gmail.com',
];

export function isManagerEmail(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_MANAGER_EMAILS.includes(email.trim().toLowerCase());
}

export async function getManagerSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return isManagerEmail(data.session?.user.email);
}

export function watchManagerSession(onChange: (allowed: boolean) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(isManagerEmail(session?.user.email));
  });
  return () => data.subscription.unsubscribe();
}

export async function requestManagerMagicLink(): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email: MANAGER_EMAIL,
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + '/?hub=true' },
  });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function signOutManager(): Promise<void> {
  await supabase.auth.signOut();
  sessionStorage.removeItem('eldeeb_hub_auth');
}

export async function signInManagerWithGoogle(): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/?hub=true',
      queryParams: { prompt: 'select_account' },
    },
  });
  return error ? { success: false, error: error.message } : { success: true };
}
