import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

// La marca la agrega el `template` del root layout. El canonical propio evita
// heredar el "/" del root.
export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo motorflow recolecta, usa y protege los datos personales en su plataforma para concesionarios.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <LegalShell title="Política de Privacidad" lastUpdated="15 de junio de 2026">
      <p>
        Esta Política de Privacidad describe cómo se tratan los datos personales en{" "}
        <strong>motorflow</strong> (la &quot;Plataforma&quot;), un servicio de software
        como servicio (SaaS) que permite a concesionarios de vehículos tener su sitio
        web, gestionar su catálogo, captar consultas y administrar su operatoria de venta.
      </p>
      <p>
        El tratamiento de datos personales se realiza conforme a la{" "}
        <strong>Ley N.º 25.326 de Protección de los Datos Personales</strong> de la
        República Argentina, su Decreto reglamentario 1558/2001 y las disposiciones de la
        Agencia de Acceso a la Información Pública (AAIP).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de los datos recolectados de forma directa por la
        Plataforma es:
      </p>
      <ul>
        <li><strong>Titular:</strong> Mateo Lonzayes Perales</li>
        <li><strong>Correo de contacto:</strong> <a href="mailto:soporte@motorflowapp.com">soporte@motorflowapp.com</a></li>
      </ul>
      <p>
        Cualquier solicitud vinculada a tus datos personales puede canalizarse a través del
        correo de contacto indicado.
      </p>

      <h2>2. Doble rol: responsable y encargado</h2>
      <p>
        Es importante distinguir dos situaciones según de quién sean los datos:
      </p>
      <ul>
        <li>
          <strong>Como responsable:</strong> respecto de los datos de las personas que
          contratan o se registran en motorflow (los concesionarios y sus titulares de
          cuenta), y de los visitantes de nuestro sitio de marketing.
        </li>
        <li>
          <strong>Como encargado del tratamiento:</strong> respecto de los datos que cada
          concesionario carga en su panel sobre sus propios clientes, consultas (leads) y
          documentación de venta. En esos casos, el <strong>responsable</strong> es el
          concesionario, y motorflow solo trata esos datos por cuenta y orden suya, para
          prestarle el servicio. El concesionario es quien debe contar con la base legal y
          el consentimiento de sus clientes para cargar dichos datos.
        </li>
      </ul>

      <h2>3. Datos que recolectamos</h2>
      <h3>3.1. De los titulares de cuenta (concesionarios)</h3>
      <ul>
        <li>Datos de identificación y contacto: nombre, correo electrónico, teléfono.</li>
        <li>Datos del concesionario: nombre comercial, dirección, localidad, provincia, logo y branding.</li>
        <li>Credenciales de acceso, gestionadas por nuestro proveedor de autenticación (ver sección 6).</li>
        <li>Datos de la suscripción y, eventualmente, de facturación.</li>
      </ul>
      <h3>3.2. Datos cargados por el concesionario sobre terceros</h3>
      <ul>
        <li>Consultas (leads): nombre, correo, teléfono y mensaje de potenciales compradores.</li>
        <li>Clientes: nombre, tipo y número de documento (DNI, CUIT, CUIL, pasaporte), domicilio y contacto.</li>
        <li>
          <strong>Documentación del legajo de venta:</strong> imágenes y archivos como DNI,
          formularios (p. ej. F08), boletos y facturas. Estos pueden constituir{" "}
          <strong>datos personales sensibles o de carácter reservado</strong> y reciben
          protección reforzada (ver sección 7).
        </li>
        <li>Reseñas y opiniones públicas dejadas por clientes en el sitio del concesionario.</li>
      </ul>
      <h3>3.3. De visitantes del sitio</h3>
      <ul>
        <li>Datos de la lista de espera (waitlist): correo electrónico y, opcionalmente, nombre y concesionario.</li>
        <li>Datos técnicos de navegación: dirección IP, tipo de dispositivo y navegador, y cookies (ver sección 9).</li>
      </ul>

      <h2>4. Finalidad del tratamiento</h2>
      <ul>
        <li>Prestar, mantener y mejorar la Plataforma y sus funcionalidades.</li>
        <li>Crear y administrar las cuentas y los sitios públicos de los concesionarios.</li>
        <li>Permitir la gestión de catálogo, consultas, clientes y ventas.</li>
        <li>Gestionar la suscripción, el período de prueba y la facturación.</li>
        <li>Brindar soporte y comunicarnos por cuestiones operativas del servicio.</li>
        <li>Cumplir obligaciones legales y prevenir fraudes o abusos.</li>
      </ul>

      <h2>5. Base legal y consentimiento</h2>
      <p>
        El tratamiento se basa en el consentimiento del titular, en la ejecución de la
        relación contractual con el concesionario y en el cumplimiento de obligaciones
        legales. Al utilizar la Plataforma, el titular de cuenta presta su consentimiento
        para el tratamiento descripto. Respecto de los datos de terceros, el concesionario
        declara contar con la base legal y el consentimiento correspondientes.
      </p>

      <h2>6. Terceros y encargados (sub-encargados)</h2>
      <p>
        Para operar, la Plataforma se apoya en proveedores que pueden tratar datos por
        nuestra cuenta, algunos ubicados fuera de la Argentina. Esto puede implicar una{" "}
        <strong>transferencia internacional de datos</strong> a países que la normativa
        argentina considera con nivel de protección adecuado o, en su defecto, sujeta a
        garantías contractuales. Entre ellos:
      </p>
      <ul>
        <li><strong>Autenticación de usuarios</strong> (gestión de cuentas y credenciales).</li>
        <li><strong>Base de datos y alojamiento</strong> de la aplicación.</li>
        <li><strong>Almacenamiento de archivos</strong> (imágenes del catálogo y documentos del legajo).</li>
        <li><strong>Servicios de caché, límite de uso y envío de correos</strong>.</li>
      </ul>
      <p>
        Con cada proveedor se procura mantener acuerdos que exijan niveles de seguridad y
        confidencialidad adecuados. No vendemos ni alquilamos datos personales a terceros.
      </p>

      <h2>7. Seguridad de la información</h2>
      <ul>
        <li>Los documentos del legajo de venta se guardan en almacenamiento privado y se sirven mediante enlaces firmados de duración limitada; no son de acceso público.</li>
        <li>Las credenciales de integraciones se almacenan cifradas.</li>
        <li>Se aplican controles de aislamiento por concesionario (multi-tenant): cada cuenta solo accede a sus propios datos.</li>
        <li>Se utilizan conexiones cifradas (HTTPS) y medidas técnicas y organizativas razonables para resguardar la información.</li>
      </ul>
      <p>
        Ningún sistema es 100% infalible; nos comprometemos a aplicar medidas razonables y
        a notificar incidentes de seguridad cuando corresponda conforme a la normativa.
      </p>

      <h2>8. Conservación de los datos</h2>
      <p>
        Conservamos los datos mientras la cuenta esté activa y durante el plazo necesario
        para cumplir las finalidades descriptas y las obligaciones legales (por ejemplo,
        contables e impositivas). Al darse de baja una cuenta, los datos asociados pueden
        eliminarse o anonimizarse, salvo aquellos que debamos conservar por ley.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Utilizamos cookies y tecnologías similares necesarias para el funcionamiento de la
        Plataforma (por ejemplo, mantener la sesión) y, eventualmente, para entender su
        uso y mejorarla. Podés configurar tu navegador para rechazarlas, aunque algunas
        funciones podrían dejar de operar correctamente.
      </p>

      <h2>10. Derechos de los titulares</h2>
      <p>
        Conforme a la Ley 25.326, todo titular tiene derecho a acceder, rectificar,
        actualizar y suprimir sus datos personales. El ejercicio del derecho de acceso es
        gratuito a intervalos no inferiores a seis meses, salvo interés legítimo acreditado.
        Para ejercerlos, escribinos a{" "}
        <a href="mailto:soporte@motorflowapp.com">soporte@motorflowapp.com</a>.
      </p>
      <p>
        Si los datos fueron cargados por un concesionario (eres su cliente o consulta),
        dirigí tu solicitud a ese concesionario, que es el responsable; motorflow lo
        asistirá en lo que corresponda como encargado.
      </p>
      <p>
        La <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, en su carácter
        de autoridad de control de la Ley 25.326, atiende denuncias y reclamos por
        incumplimientos a la normativa de protección de datos.
      </p>

      <h2>11. Menores de edad</h2>
      <p>
        La Plataforma está dirigida a personas mayores de edad que operan o trabajan en
        concesionarios. No recolectamos de forma intencional datos de menores de edad.
      </p>

      <h2>12. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta Política de Privacidad. Publicaremos la versión vigente en
        esta página con su fecha de última actualización. El uso continuado de la
        Plataforma implica la aceptación de los cambios.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Por cualquier consulta sobre esta política o sobre el tratamiento de tus datos,
        escribinos a <a href="mailto:soporte@motorflowapp.com">soporte@motorflowapp.com</a>.
      </p>
    </LegalShell>
  );
}
