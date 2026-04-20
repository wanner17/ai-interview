export function parseCookies(cookieHeader?: string) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((accumulator, pair) => {
    const [rawName, ...rawValue] = pair.trim().split('=');
    if (!rawName) {
      return accumulator;
    }
    accumulator[rawName] = decodeURIComponent(rawValue.join('='));
    return accumulator;
  }, {});
}
