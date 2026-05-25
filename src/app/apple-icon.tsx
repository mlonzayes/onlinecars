import { ImageResponse } from "next/og";

// Convención de Next.js: se sirve como <link rel="apple-touch-icon">.
// Lo usan iOS y Android cuando el user agrega el sitio al home screen.
// Tiene que ser cuadrado y mínimo 180x180.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 120,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          borderRadius: 32,
          letterSpacing: "-0.05em",
        }}
      >
        m
      </div>
    ),
    { ...size }
  );
}
