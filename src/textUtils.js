export const MAX_WORDS = 10000;

export function normalizeText(value) {
  return String(value ?? "")
    .replace(/\u0000/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitWords(value) {
  const text = normalizeText(value);
  return text ? text.split(/\s+/).filter(Boolean) : [];
}

export function countWords(value) {
  return splitWords(value).length;
}

export function withinLimit(value) {
  return countWords(value) <= MAX_WORDS;
}

export function limitMessage(count) {
  return `This content has ${count.toLocaleString()} words. FastReader accepts a maximum of ${MAX_WORDS.toLocaleString()} words.`;
}

export function clipToLimit(value) {
  return splitWords(value).slice(0, MAX_WORDS).join(" ");
}
