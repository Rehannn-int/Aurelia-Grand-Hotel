export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isDemoModeAvailable() {
  return false;
}

export function buildDemoUser() {
  throw new Error('Demo authentication is disabled. Use a real administrator account.');
}

export function readDemoSession() {
  return null;
}

export function writeDemoSession() {
  // Demo sessions are intentionally disabled. All admin access must go through the real API-backed authentication flow.
}
