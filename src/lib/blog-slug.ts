// Conectores que no suman a la URL ("como-tasar-usado" > "como-tasar-un-usado").
const STOPWORDS = new Set([
  "a", "al", "con", "de", "del", "el", "en", "la", "las", "lo", "los",
  "para", "por", "que", "su", "sus", "tu", "tus", "un", "una", "y", "o",
]);

/** Título → slug de URL: minúsculas, sin acentos ni conectores, con guiones. */
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((word) => word && !STOPWORDS.has(word))
    .join("-")
    .slice(0, 80)
    .replace(/-+$/, "");
}
