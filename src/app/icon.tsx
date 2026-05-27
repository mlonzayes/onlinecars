import { ImageResponse } from "next/og";

// Convención de Next.js App Router: este archivo se sirve como /icon
// y se referencia automáticamente desde <link rel="icon"> en el HTML.
// Se renderiza al build/request — siempre queda crisp y cuadrado.

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          borderRadius: 6,
          letterSpacing: "-0.05em",
        }}
      >
        m
      </div>
    ),
    { ...size }
  );
}
