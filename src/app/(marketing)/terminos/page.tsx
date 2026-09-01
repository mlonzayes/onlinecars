import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

// La marca la agrega el `template` del root layout. El canonical propio evita
// heredar el "/" del root.
export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y condiciones de uso de motorflow, la plataforma para que tu concesionaria tenga su propia página web y gestione su stock.",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <LegalShell title="Términos y Condiciones" lastUpdated="15 de junio de 2026">
      <p>
        Estos Términos y Condiciones (los &quot;Términos&quot;) regulan el acceso y uso de{" "}
        <strong>motorflow</strong> (la &quot;Plataforma&quot;), un servicio de software como
        servicio (SaaS) operado por <strong>Mateo Lonzayes Perales</strong> (el
        &quot;Prestador&quot;). Podés contactarte con el Prestador en{" "}
        <a href="mailto:soporte@motorflowapp.com">soporte@motorflowapp.com</a>. Al
        registrarte o utilizar la Plataforma, aceptás estos Términos en su totalidad.
      </p>

      <h2>1. Descripción del servicio</h2>
      <p>
        motorflow permite a concesionarios de vehículos crear un sitio web propio,
        publicar y gestionar su catálogo, captar consultas, y administrar clientes,
        ventas y documentación asociada, a través de un panel de administración.
      </p>

      <h2>2. Registro y cuenta</h2>
      <ul>
        <li>Para usar la Plataforma debés crear una cuenta y aportar información veraz, completa y actualizada.</li>
        <li>Sos responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada bajo tu cuenta.</li>
        <li>Debés notificarnos de inmediato ante cualquier uso no autorizado de tu cuenta.</li>
        <li>La autenticación se gestiona a través de un proveedor externo; su uso está sujeto también a las condiciones de dicho proveedor.</li>
      </ul>

      <h2>3. Planes, período de prueba y facturación</h2>
      <ul>
        <li>La Plataforma ofrece distintos planes con diferentes límites y funcionalidades, descriptos en el sitio.</li>
        <li>Las cuentas nuevas pueden iniciar en un <strong>período de prueba</strong> con capacidades reducidas y por tiempo limitado.</li>
        <li>El alta de un plan pago y su facturación se coordinan según las modalidades informadas al momento de la contratación.</li>
        <li>Los precios pueden actualizarse; los cambios se informarán con antelación razonable y regirán para los períodos siguientes.</li>
        <li>Podés cancelar tu suscripción en cualquier momento; salvo disposición legal en contrario, los importes ya abonados no son reembolsables por los períodos en curso.</li>
      </ul>

      <h2>4. Uso aceptable</h2>
      <p>Al usar la Plataforma te comprometés a no:</p>
      <ul>
        <li>Publicar contenido falso, engañoso, ilícito, difamatorio o que infrinja derechos de terceros.</li>
        <li>Cargar datos personales de terceros sin contar con la base legal y el consentimiento necesarios.</li>
        <li>Vulnerar la seguridad de la Plataforma, acceder a datos de otros concesionarios o realizar ingeniería inversa.</li>
        <li>Utilizar la Plataforma para enviar spam, malware o realizar actividades fraudulentas.</li>
        <li>Usar el servicio para fines distintos de la operatoria legítima de un concesionario.</li>
      </ul>

      <h2>5. Contenido y datos del usuario</h2>
      <ul>
        <li>Conservás la titularidad del contenido que cargás (vehículos, imágenes, datos de clientes, documentos).</li>
        <li>
          Sos el <strong>responsable</strong> de los datos personales de tus clientes y
          consultas que cargues, y declarás contar con el consentimiento y la base legal
          para tratarlos. motorflow actúa como <strong>encargado del tratamiento</strong>,
          conforme se detalla en la{" "}
          <a href="/privacidad">Política de Privacidad</a>.
        </li>
        <li>Nos otorgás una licencia limitada para alojar y procesar ese contenido con el único fin de prestarte el servicio.</li>
        <li>Sos responsable de la veracidad, legalidad y vigencia de la información publicada en tu sitio (precios, datos de los vehículos, documentación, etc.).</li>
      </ul>

      <h2>6. Propiedad intelectual</h2>
      <p>
        La Plataforma, su software, diseño, marcas y demás elementos son propiedad del
        Prestador o de sus licenciantes y están protegidos por la normativa aplicable. No
        se cede ningún derecho de propiedad intelectual más allá de la licencia de uso
        necesaria para utilizar el servicio.
      </p>

      <h2>7. Disponibilidad del servicio</h2>
      <p>
        Procuramos mantener la Plataforma disponible y funcionando correctamente, pero el
        servicio se brinda &quot;tal cual&quot; (<em>as is</em>) y &quot;según
        disponibilidad&quot;. Pueden existir interrupciones por mantenimiento, fallas
        técnicas o causas ajenas a nuestro control. No garantizamos disponibilidad
        ininterrumpida ni ausencia de errores.
      </p>

      <h2>8. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley, el Prestador no será responsable por
        daños indirectos, lucro cesante, pérdida de datos o perjuicios derivados del uso o
        imposibilidad de uso de la Plataforma. Nada en estos Términos limita derechos
        irrenunciables que pudieran corresponder a consumidores conforme a la normativa de
        defensa del consumidor.
      </p>

      <h2>9. Indemnidad</h2>
      <p>
        Te comprometés a mantener indemne al Prestador frente a reclamos de terceros
        derivados del contenido que cargues, del incumplimiento de estos Términos o del uso
        indebido de la Plataforma, incluyendo el tratamiento de datos personales sin la
        debida base legal.
      </p>

      <h2>10. Suspensión y baja</h2>
      <p>
        Podemos suspender o dar de baja cuentas que incumplan estos Términos, que generen
        riesgos de seguridad o ante falta de pago. Podés solicitar la baja de tu cuenta en
        cualquier momento escribiendo a{" "}
        <a href="mailto:soporte@motorflowapp.com">soporte@motorflowapp.com</a>.
      </p>

      <h2>11. Protección de datos personales</h2>
      <p>
        El tratamiento de datos personales se rige por nuestra{" "}
        <a href="/privacidad">Política de Privacidad</a>, que forma parte integrante de
        estos Términos.
      </p>

      <h2>12. Modificaciones</h2>
      <p>
        Podemos modificar estos Términos. Publicaremos la versión vigente en esta página
        con su fecha de actualización. El uso continuado de la Plataforma tras los cambios
        implica su aceptación.
      </p>

      <h2>13. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier
        controversia, las partes se someten a la jurisdicción de los tribunales ordinarios
        de <strong>Quilmes, Provincia de Buenos Aires</strong>, sin perjuicio de los fueros que por ley
        correspondan a los consumidores.
      </p>

      <h2>14. Contacto</h2>
      <p>
        Por cualquier consulta sobre estos Términos, escribinos a{" "}
        <a href="mailto:soporte@motorflowapp.com">soporte@motorflowapp.com</a>.
      </p>
    </LegalShell>
  );
}
