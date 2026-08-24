export function normalizePrompt(prompt) {
  return String(prompt)
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeRoutingAlias(prompt) {
  return normalizePrompt(prompt)
    .replace(/[.!?。！？]+$/u, '')
    .trim();
}
