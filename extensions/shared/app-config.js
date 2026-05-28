export const APP_URL =
  'https://thankyouapp-production.up.railway.app';

export function apiUrl(path) {
  return `${APP_URL}${path}`;
}
