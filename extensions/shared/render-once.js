/* global globalThis */

const RENDERED_EXTENSIONS_KEY = '__thankYouRenderedExtensions';
const CLAIM_TTL_MS = 3000;

export function claimExtensionRender(type) {
  const rendered =
    globalThis[RENDERED_EXTENSIONS_KEY] ||
    (globalThis[RENDERED_EXTENSIONS_KEY] = {});

  if (rendered[type]) {
    return false;
  }

  rendered[type] = true;
  return true;
}

export async function claimStoredExtensionRender(storage, type) {
  if (!storage) {
    return claimExtensionRender(type);
  }

  const key = `thank-you-rendered:${type}`;
  const now = Date.now();
  const existing = await storage.read(key).catch(() => null);

  if (
    existing?.claimId &&
    existing?.createdAt &&
    now - existing.createdAt < CLAIM_TTL_MS
  ) {
    return false;
  }

  const claimId = `${now}-${Math.random().toString(36).slice(2)}`;

  await storage.write(key, {claimId, createdAt: now});

  const stored = await storage.read(key).catch(() => null);

  return stored?.claimId === claimId ? claimId : '';
}

export function refreshStoredExtensionRender(storage, type, claimId) {
  return storage.write(
    `thank-you-rendered:${type}`,
    {claimId, createdAt: Date.now()},
  );
}
