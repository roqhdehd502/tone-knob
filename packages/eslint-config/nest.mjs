// @ts-check
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { base } from './base.mjs';

export const nest = tseslint.config(
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      // no-floating-promises/no-unsafe-argument는 타입 정보가 필요한 규칙이라 projectService로 tsconfig를 연결해야 동작한다.
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
);
