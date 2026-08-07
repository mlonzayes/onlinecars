import type { Dealership } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionsBuilderClient } from "@/components/dashboard/sections-builder/sections-builder-client";
import { WebsiteSettings } from "@/components/dashboard/settings/website-settings";
import { TemplateSelector } from "@/components/dashboard/settings/template-selector";
import { ContactForm } from "@/components/dashboard/settings/contact-form";
import { WhatsappFabCard } from "@/components/dashboard/settings/whatsapp-fab-card";
import { LocationPicker } from "@/components/dashboard/settings/location-picker";
import { SocialLinksForm } from "@/components/dashboard/settings/social-links-form";
import { getPlanLimits } from "@/lib/plans";
import type { SectionsPageData } from "@/app/dashboard/sitio-web/sections-page-data";
import type { DealershipTheme, SocialLinks } from "@/types";

interface SiteEditorProps {
  dealership: Dealership;
  sectionsData: SectionsPageData;
  reviews: Array<{
    id: string;
    name: string;
    content: string;
    rating: number;
    status: string;
    createdAt: string;
  }>;
}

/**
 * Editor completo del sitio de un concesionario. Lo usa el modo plataforma
 * (/admin/sitios/[id]/editar).
 *
 * NO reimplementa nada: compone los mismos componentes que el dealer usa en
 * /dashboard/sitio-web y en la pestaña General de /dashboard/configuracion.
 * Todos postean a /api/concesionario/*, que resuelve el tenant destino por el
 * contexto del modo plataforma — por eso funcionan acá sin cambiarles una línea.
 *
 * Van en pestañas porque de corrido son ~12 cards: el builder de secciones, seis
 * cards de apariencia y cuatro de datos. Todo junto es un scroll imposible de
 * usar cuando estás armándole la web a alguien.
 */
export function SiteEditor({ dealership, sectionsData, reviews }: SiteEditorProps) {
  const theme = dealership.theme as DealershipTheme | null;
  const limits = getPlanLimits(dealership);

  return (
    <Tabs defaultValue="contenido" className="w-full space-y-6">
      <TabsList>
        <TabsTrigger value="contenido">Contenido</TabsTrigger>
        <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
        <TabsTrigger value="datos">Datos y contacto</TabsTrigger>
      </TabsList>

      <TabsContent value="contenido" className="mt-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Secciones del sitio</CardTitle>
            <CardDescription>
              Activá, ordená y editá las secciones que se muestran en el sitio público
              de este concesionario. Las marcas y las opiniones se editan dentro de su
              propia sección.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SectionsBuilderClient
              initialSections={sectionsData.sections}
              initialMedia={sectionsData.media}
              theme={theme}
              reviews={reviews}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="apariencia" className="mt-0 space-y-6">
        <WebsiteSettings
          dealership={{
            slug: dealership.slug,
            logo: dealership.logo,
            favicon: dealership.favicon,
            website: dealership.website,
            siteEnabled: dealership.siteEnabled,
            announcement: dealership.announcement,
            templateId: dealership.templateId,
          }}
          theme={theme}
        />
        <TemplateSelector currentTemplateId={dealership.templateId} />
      </TabsContent>

      <TabsContent value="datos" className="mt-0 space-y-6">
        <ContactForm dealership={dealership} />
        <WhatsappFabCard
          enabled={dealership.whatsappFabEnabled}
          message={dealership.whatsappMessage}
          hasWhatsappNumber={Boolean(dealership.whatsapp)}
          // El gating por plan se respeta igual en modo plataforma: si el cliente
          // no tiene el plan, el FAB no se activa desde acá. El handler lo fuerza
          // a false server-side de todos modos — esto solo evita prometerlo en la UI.
          allowWhatsappFab={limits.allowWhatsappFab}
          currentPlan={dealership.plan}
        />
        <LocationPicker
          latitude={dealership.latitude}
          longitude={dealership.longitude}
        />
        <SocialLinksForm
          socialLinks={(dealership.socialLinks as SocialLinks | null) ?? null}
        />
      </TabsContent>
    </Tabs>
  );
}
