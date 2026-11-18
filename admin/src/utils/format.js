export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatMoney(value, currency = 'INR') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value) || 0);
}

export function titleCase(value = '') {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
