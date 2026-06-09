# Diseño Técnico: Isolation y Slugs

## 1. Arquitectura de Cambios

El diseño se centra en tres pilares:
1. **Capa de Datos**: Modificación del esquema Prisma y script de migración.
2. **Capa Lógica**: Funciones puras para generar los slugs y buscar vehículos.
3. **Capa de Presentación y API**: Actualización de rutas y componentes para remover las referencias al `id` interno.

## 2. Diseño del Esquema Prisma
```prisma
model Vehicle {
  // ... (otros campos)
  publicSlug  String   @default("") // Temporalmente durante migración
  
  @@unique([dealershipId, publicSlug])
}
```
*Nota: El proceso exacto de migración dependerá de si se usa `prisma migrate dev` o un script manual de Prisma Studio / ts-node.*

## 3. Lógica de Generación de Slugs
**Archivo:** `src/lib/utils/slug.ts`
```typescript
import { nanoid } from 'nanoid'; // O utilizar crypto.randomBytes si no se quiere añadir dependencia

export function generateVehicleSlug(make: string, model: string, year: number): string {
  const sanitize = (str: string) => 
    str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Se genera el ID corto de 8 caracteres
  const shortId = nanoid(8).toLowerCase();
  
  return `${sanitize(make)}-${sanitize(model)}-${year}-${shortId}`;
}
```

## 4. Interfaz de APIs Públicas
**GET Vehículos:**
La carga útil retornada al frontend desde `/api/public/tenant/[slug]/vehicles` no debe incluir `id` ni `dealershipId`. 
Estructura esperada en el frontend:
```typescript
type PublicVehicleInfo = {
  publicSlug: string;
  make: string;
  model: string;
  year: number;
  // ...
}
```

**POST Leads:**
Validación en `/api/public/tenant/[slug]/leads/route.ts` usando Zod:
```typescript
const leadSchema = z.object({
  // ...
  vehicleSlug: z.string().optional(), // en lugar de vehicleId
});
```

## 5. Árbol de Rutas y Componentes
- **Nueva ruta dinámica:** `src/app/tenant/[slug]/vehiculo/[publicSlug]/page.tsx`
  - Recibe `params: { slug: string, publicSlug: string }`.
  - El fetching en servidor hará algo como: `prisma.vehicle.findUnique({ where: { dealershipId_publicSlug: { dealershipId, publicSlug } } })`.
- **Componentes:**
  - Enlaces de navegación: `<Link href={\`/tenant/\${slug}/vehiculo/\${vehicle.publicSlug}\`}>`
  - Modificar `TenantContactForm` para manejar `vehicleSlug` en lugar de IDs, pasándolo en los metadatos del envío.

## 6. Consideraciones de Seguridad
Al quitar los identificadores autonuméricos/UUIDs de la base de datos de las rutas públicas, hacemos imposible el scraping predecible ("ID guessing") y evitamos exponer las llaves foráneas (`dealershipId`). Además, al **excluir explícitamente la patente**, mantenemos la privacidad intacta.
