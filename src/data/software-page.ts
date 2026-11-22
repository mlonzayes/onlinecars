/**
 * Contenido de /software-para-concesionarias (página pilar para búsquedas
 * genéricas: "software de gestión para concesionarias", "sistema para agencia
 * de autos"). Todo lo que se dice acá EXISTE hoy en el producto: si una
 * feature cambia de plan o se saca, actualizalo acá también.
 */

export interface SoftwareModule {
  title: string;
  desc: string;
}

export interface SoftwareModuleGroup {
  id: string;
  heading: string;
  modules: SoftwareModule[];
}

export interface ComparisonRow {
  topic: string;
  spreadsheet: string;
  motorflow: string;
}

export const SOFTWARE_SUMMARY = [
  "Stock con fotos, gastos y margen de cada auto.",
  "Las consultas de tu web entran al panel con el auto que miraron.",
  "Clientes, ventas con legajo de documentos y cotizaciones en PDF.",
  "Precio fijo por mes desde $23.990, sin comisión por venta.",
];

export const SOFTWARE_MODULE_GROUPS: SoftwareModuleGroup[] = [
  {
    id: "stock",
    heading: "Stock y números de cada auto",
    modules: [
      {
        title: "Control de stock",
        desc: "Cargás cada unidad con fotos, precio en pesos o dólares, kilómetros, patente y VIN, y la marcás como disponible, reservada o vendida. Si hoy tenés el stock en una planilla, lo importás desde Excel.",
      },
      {
        title: "Gastos y margen por unidad",
        desc: "Le imputás a cada auto lo que gastaste en mecánica, detailing o gestoría, y el panel calcula cuánto le ganaste. Los costos se pueden ocultar a los vendedores.",
      },
      {
        title: "Cotización del dólar",
        desc: "Toma el oficial del día y le suma el spread que definas, para convertir costos y precios sin mezclar pesos con dólares.",
      },
    ],
  },
  {
    id: "ventas",
    heading: "Consultas, clientes y ventas",
    modules: [
      {
        title: "Consultas (CRM de leads)",
        desc: "Las consultas del sitio llegan al panel con el auto que miró la persona. Las seguís por estado (nueva, contactada, calificada, cerrada) y le escribís por WhatsApp con un toque.",
      },
      {
        title: "Clientes y ventas",
        desc: "Cada venta pasa de reserva a en curso y a completada, con seña, precio final, factura y fecha de entrega. El estado del auto se actualiza solo.",
      },
      {
        title: "Legajo digital",
        desc: "DNI, 08, boleto y factura de cada operación quedan guardados en un almacenamiento privado, y solo se abren con un link que vence a los pocos minutos.",
      },
      {
        title: "Cotizaciones",
        desc: "Armás cotizaciones de compra y de venta con numeración propia y las mandás en PDF.",
      },
    ],
  },
  {
    id: "web",
    heading: "Tu web y Mercado Libre",
    modules: [
      {
        title: "Página web de la agencia",
        desc: "Tu catálogo en tuagencia.motorflowapp.com, con tu logo y tus colores, filtros, ficha de cada auto y formulario de consulta. Lo que publicás en el panel aparece en la web.",
      },
      {
        title: "Integración con Mercado Libre",
        desc: "Desde el plan Media conectás tu cuenta y publicás en Mercado Libre desde el mismo panel.",
      },
    ],
  },
  {
    id: "equipo",
    heading: "Tu equipo y el asistente",
    modules: [
      {
        title: "Vendedores y permisos",
        desc: "Invitás a tus vendedores con rol de administrador, editor o solo lectura. Base trae 1 usuario, Media 3 y Premium no tiene límite.",
      },
      {
        title: "Asistente con IA",
        desc: "Le escribís \"cargale 150.000 de detailing al Corolla\" y lo hace. Antes de guardar te muestra el cambio para que lo confirmes, y los autos nuevos entran como borrador.",
      },
    ],
  },
];

export const SOFTWARE_COMPARISON: ComparisonRow[] = [
  {
    topic: "Stock en la web",
    spreadsheet: "Lo actualizás a mano en cada lugar donde publicás.",
    motorflow: "El auto que cargás en el panel aparece en tu sitio.",
  },
  {
    topic: "Margen por auto",
    spreadsheet: "Sumás los gastos en otra hoja y cruzás con el precio de venta.",
    motorflow: "Cada gasto queda en el auto y el margen se calcula al vender.",
  },
  {
    topic: "Consultas",
    spreadsheet: "Llegan sueltas por WhatsApp, mail y portales.",
    motorflow: "Las de tu web entran al panel con el auto que miraron.",
  },
  {
    topic: "Documentos",
    spreadsheet: "Carpetas, papeles y fotos en el celular.",
    motorflow: "Un legajo por venta, en almacenamiento privado.",
  },
  {
    topic: "Varios vendedores",
    spreadsheet: "Todos tocan el mismo archivo.",
    motorflow: "Cada uno con su usuario y sus permisos.",
  },
];

export const SOFTWARE_FAQS = [
  {
    question: "¿Qué es un software de gestión para concesionarias?",
    answer: "Un sistema que junta el stock, las consultas, los clientes y las ventas de la agencia en un solo lugar, en vez de tenerlos repartidos entre planillas, WhatsApp y portales.",
  },
  {
    question: "¿Sirve para una agencia chica de usados?",
    answer: "Sí. El plan Base trae 1 usuario y hasta 30 autos publicados. Si crecés, cambiás de plan en la misma cuenta, sin migrar nada.",
  },
  {
    question: "¿Tengo que instalar algo?",
    answer: "No. Funciona en el navegador, desde la computadora o el celular.",
  },
  {
    question: "¿Puedo pasar mi stock desde Excel?",
    answer: "Sí. El panel importa los vehículos desde una planilla de Excel y los deja como borrador para que los revises antes de publicarlos.",
  },
  {
    question: "¿Cobran comisión por venta?",
    answer: "No. Pagás el plan por mes y listo.",
  },
  {
    question: "¿Y si después me quiero ir?",
    answer: "Cancelás cuando quieras y te llevás tus datos.",
  },
];
