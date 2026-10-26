/**
 * Links de navegación de la web de marketing — fuente única para el navbar y
 * el menú mobile. Anclas con "/" adelante: se renderizan también en /precios,
 * /blog y los legales, donde un href="#faq" pelado no lleva a ningún lado.
 */
export const MARKETING_NAV_LINKS = [
  { href: "/#producto", label: "Producto" },
  { href: "/#integraciones", label: "Integraciones" },
  { href: "/precios", label: "Planes" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
] as const;
