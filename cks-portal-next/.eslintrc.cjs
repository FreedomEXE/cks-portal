/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: .eslintrc.cjs
 *
 * Description:
 * ESLint configuration for TypeScript monorepo with import boundaries
 *
 * Responsibilities:
 * - Enforce coding standards across all packages
 * - Prevent circular dependencies and enforce import boundaries
 * - Integrate with TypeScript and React
 *
 * Role in system:
 * - Used by VS Code and CI to lint code
 *
 * Notes:
 * Uses CommonJS format for compatibility
 */
/*───────────────────────────────────────────────*/
//  Manifested by Freedom_EXE
/*───────────────────────────────────────────────*/

module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './packages/*/tsconfig.json', './Frontend/tsconfig.json', './Backend/tsconfig.json', './Auth/tsconfig.json', './Gateway/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.json', './packages/*/tsconfig.json', './Frontend/tsconfig.json', './Backend/tsconfig.json', './Auth/tsconfig.json', './Gateway/tsconfig.json'],
      },
    },
  },
  rules: {
    // Import rules for monorepo boundaries
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Frontend can only import from packages/, Auth/, and Shared/
          {
            target: './Frontend/src/**/*',
            from: './Backend/**/*',
            message: 'Frontend cannot import from Backend',
          },
          {
            target: './Frontend/src/**/*',
            from: './Gateway/**/*',
            message: 'Frontend cannot import from Gateway',
          },
          {
            target: './Frontend/src/**/*',
            from: './Database/**/*',
            message: 'Frontend cannot import from Database',
          },
          // Backend can only import from Shared/ and Database/
          {
            target: './Backend/src/**/*',
            from: './Frontend/**/*',
            message: 'Backend cannot import from Frontend',
          },
          {
            target: './Backend/src/**/*',
            from: './Auth/**/*',
            message: 'Backend cannot import from Auth package',
          },
          {
            target: './Backend/src/**/*',
            from: './Gateway/**/*',
            message: 'Backend cannot import from Gateway',
          },
          // Packages should be self-contained
          {
            target: './packages/ui/src/**/*',
            from: './packages/domain-widgets/**/*',
            message: 'UI package cannot import from domain-widgets',
          },
        ],
      },
    ],
    'import/no-cycle': 'error',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // React rules
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    {
      files: ['*.js', '*.cjs'],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
};