export function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`Content field "${field}" must be a non-empty string.`);
  }
  return value;
}

export function requireStringArray(value, field, { allowEmpty = false } = {}) {
  if (
    !Array.isArray(value)
    || (!allowEmpty && value.length === 0)
    || value.some((item) => typeof item !== 'string' || !item.trim())
  ) {
    throw new TypeError(`Content field "${field}" must be an array of non-empty strings.`);
  }
  return value;
}
