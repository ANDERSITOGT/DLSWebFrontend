import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // `any` es habitual al mapear payloads dinámicos del backend: se reporta
      // como aviso (no bloquea CI ni la build) para no forzar tipos ficticios.
      "@typescript-eslint/no-explicit-any": "warn",
      // Este proyecto exporta hooks y componentes desde el mismo módulo por
      // convención; la regla de react-refresh es demasiado estricta aquí.
      "react-refresh/only-export-components": "off",
      // Patrón válido: `cond && fn()` dentro de un handler.
      "@typescript-eslint/no-unused-expressions": ["error", { "allowShortCircuit": true, "allowTernary": true }],
    },
  },
])

