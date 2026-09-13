export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Ajoute un court suffixe aléatoire pour éviter les collisions de slug. */
export function uniqueSlug(text: string): string {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${slugify(text)}-${suffix}`;
}