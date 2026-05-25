import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FlatCompat permite usar configs viejas (eslint-config-next exporta legacy)
// con la nueva flat config de ESLint 9.
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  // Excluir output de build y artefactos generados — no tiene sentido lintearlos.
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**",
      "next-env.d.ts",
      "prisma/migrations/**",
    ],
  },

  // Reglas core de Next.js + web vitals (hooks, image, link, etc).
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Reglas custom del proyecto.
  {
    rules: {
      // No usar confirm/alert nativos — usar el ConfirmDialog custom.
      // Ver patrón en CLAUDE.md punto 5 (Patrones para nuevas pantallas).
      "no-restricted-globals": [
        "error",
        {
          name: "confirm",
          message: "Usá <ConfirmDialog /> de src/components/ui/confirm-dialog.tsx — el confirm() nativo no se permite.",
        },
        {
          name: "alert",
          message: "Usá toast() de sonner o un <Dialog /> — alert() nativo no se permite.",
        },
      ],

      // Convención del proyecto: args/vars con underscore prefix son intencionalmente
      // no usados (típico en handlers de Next: `_request`, `_ctx`). El default de
      // @typescript-eslint/no-unused-vars no los ignora — acá lo configuramos.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default config;
