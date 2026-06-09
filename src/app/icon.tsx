import { ImageResponse } from "next/og";

// Favicon dinámico del sitio (no del tenant — eso vive en tenant/[slug]/layout.tsx).
// Lo genera Next en runtime, sin assets. Si tocás el diseño, mantenelo SIMPLE:
// a 16x16 cualquier detalle se pierde — sólo silueta + contraste.
export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const PRIMARY = "#2563eb";

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        {/* Isotipo: autito blanco simplificado. Path derivado del icono Car de
            lucide, achicado y con strokeWidth aumentado para que se lea a 16px. */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
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
