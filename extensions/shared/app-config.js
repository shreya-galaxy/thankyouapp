export const APP_URL =
  'https://conditioning-matter-obligation-assignments.trycloudflare.com';

export function apiUrl(path) {
  return `${APP_URL}${path}`;
}
