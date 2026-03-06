import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow `any` as warning (too many usages to fix while prototyping)
      "@typescript-eslint/no-explicit-any": "warn",
      // Unused vars are warnings, allow underscore-prefixed vars
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      // Allow <img> elements (Next Image is optional during dev)
      "@next/next/no-img-element": "off",
      // Allow empty interfaces (common TS pattern)
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow unescaped entities in JSX (quotes, apostrophes)
      "react/no-unescaped-entities": "off",
      // Allow prefer-const as warning
      "prefer-const": "warn",
      // Allow missing deps in useEffect (common in existing code)
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
