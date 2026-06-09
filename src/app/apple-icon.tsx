import { ImageResponse } from "next/og";

// Icono para iOS al agregar a pantalla de inicio. iOS recorta automáticamente
// con sus propios rounded corners — NO le agregues borderRadius acá, queda doble.
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const PRIMARY = "#2563eb";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: PRIMARY,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.4-2.5c-.6-.6-1.6-.9-2.6-.9s-2 .3-2.6.9C7.3 8.6 6 10 6 10s-2.7.6-4.5.7C.7 11 0 11.7 0 12.6v3c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
