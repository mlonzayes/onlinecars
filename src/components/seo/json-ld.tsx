interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Inyecta structured data (schema.org) como <script type="application/ld+json">.
 * Lo leen Google (rich results) y los motores de IA para entender el sitio.
 * El contenido lo controlamos nosotros (no es input de usuario) → seguro.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
