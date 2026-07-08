// @ts-check
import { react } from "@tone-knob/eslint-config/react";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["build/**", "node_modules/**", ".react-router/**"],
  },
  ...react,
);
