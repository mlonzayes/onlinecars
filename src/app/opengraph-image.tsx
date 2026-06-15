import { ImageResponse } from "next/og";

// Imagen OG/social del dominio principal (1200x630). File-convention de Next:
// se usa automáticamente como og:image en la home y como fallback del resto.
// Generada en runtime, sin assets externos — solo texto + gradiente.
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "motorflow — Tu concesionario online";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800 }}>
          <span style={{ color: "#0f172a" }}>motor</span>
          <span style={{ color: "#2563eb" }}>flow</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 46,
            fontWeight: 700,
            color: "#0f172a",
            marginTop: 28,
          }}
        >
          Tu concesionario, online.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#475569",
            marginTop: 18,
            maxWidth: 900,
          }}
        >
          Sitio web profesional, catálogo de vehículos y captación de leads. Sin comisiones.
        </div>
      </div>
    ),
    { ...size }
  );
}
