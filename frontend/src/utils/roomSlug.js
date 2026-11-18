export function normalizeCategorySlug(value = '') {
  return String(value)
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

export function findRoomByCategorySlug(rooms, categorySlug) {
  const target = normalizeCategorySlug(categorySlug);
  if (!target || !Array.isArray(rooms)) return null;

  return rooms.find((room) => {
    const candidates = [
      room?.slug,
      room?.id,
      room?.category,
      room?.name,
      room?.categorySlug,
      room?.category?.slug,
      room?.category?.name,
    ].filter(Boolean);

    return candidates.some((candidate) => normalizeCategorySlug(candidate) === target);
  }) || null;
}
