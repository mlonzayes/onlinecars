// @types/pdfmake cubre el client-side API (window.pdfMake.createPdf). El uso
// server-side va por los módulos internos de pdfmake/js/*, que no están
// declarados en los types oficiales. Estas declaraciones cubren la superficie
// mínima que usamos.

declare module "pdfmake/js/Printer" {
  import type { TDocumentDefinitions } from "pdfmake/interfaces";

  interface FontDescriptor {
    normal: string;
    bold: string;
    italics: string;
    bolditalics: string;
  }

  // El doc producido es un PDFKit document — extiende ReadableStream y tiene
  // .end() para cerrarlo. No importamos los types de pdfkit para evitar deps.
  interface PdfKitDocument extends NodeJS.ReadableStream {
    end(): void;
  }

  // El constructor de pdfmake@0.3 requiere fonts, virtualFs y urlResolver. Sin
  // estos dos últimos, `resolveUrls` falla con "Cannot read properties of
  // undefined (reading 'resolve')" al procesar los font descriptors.
  class Printer {
    constructor(
      fontDescriptors: Record<string, FontDescriptor>,
      virtualFs: unknown,
      urlResolver: unknown,
      localAccessPolicy?: (path: string) => boolean
    );
    createPdfKitDocument(
      docDefinition: TDocumentDefinitions
    ): Promise<PdfKitDocument>;
  }

  export default Printer;
}

declare module "pdfmake/js/virtual-fs" {
  const virtualfs: unknown;
  export default virtualfs;
}

declare module "pdfmake/js/URLResolver" {
  class URLResolver {
    constructor(virtualFs: unknown);
    setUrlAccessPolicy(callback: (url: string) => boolean): void;
  }
  export default URLResolver;
}
