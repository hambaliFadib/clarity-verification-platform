export function classNameFor(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
