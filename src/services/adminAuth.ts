import { supabase } from './supabase';

export const MANAGER_EMAIL = 'mohamedgedo360@yahoo.com';

export async function getManagerSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.email?.toLowerCase() === MANAGER_EMAIL;
}

export async function requestManagerMagicLink(): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email: MANAGER_EMAIL,
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + '/#hub' },
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
      redirectTo: window.location.origin + '/#hub',
      queryParams: { prompt: 'select_account' },
    },
  });
  return error ? { success: false, error: error.message } : { success: true };
}
