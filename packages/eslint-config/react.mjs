// @ts-check
import tseslint from 'typescript-eslint';

import { base } from './base.mjs';

export const react = tseslint.config(
  ...base,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react', '^react-router'],
            ['^@?\\w'],
            ['^~/'],
            ['^\\.'],
            ['^.+\\.s?css$'],
          ],
        },
      ],
    },
  },
);
