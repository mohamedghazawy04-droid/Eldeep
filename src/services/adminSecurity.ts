const DEFAULT_ADMIN_PIN_HASH = '79d51ff29ced718a7494852271031fce06ddf5156b11862dd8c302c9feb400f6';

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyAdminPin(input: string, configuredPin?: string): Promise<boolean> {
  const clean = input.trim();
  if (!clean) return false;
  if (configuredPin && configuredPin !== '__HASHED_DEFAULT__') return clean === configuredPin;
  return (await sha256(clean)) === DEFAULT_ADMIN_PIN_HASH;
}
