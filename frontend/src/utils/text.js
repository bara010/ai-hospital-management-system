export function capitalizeWordsInput(value) {
  if (!value) return '';
  return value.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}
