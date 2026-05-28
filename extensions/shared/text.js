export function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function limitText(value, maxLength, fallback = '') {
  const text = trimText(value);

  if (!text) {
    return fallback;
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function hasText(value) {
  return trimText(value).length > 0;
}
