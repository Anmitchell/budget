import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
    // Base JavaScript recommended rules
    js.configs.recommended,

    // Prettier config (disables conflicting rules)
    prettierConfig,

    // TypeScript files configuration
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier: prettier,
        },
        rules: {
            // TypeScript recommended rules
            ...tseslint.configs.recommended.rules,

            // Prettier integration
            'prettier/prettier': 'error',

            // Custom rules
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
        },
    },

    // JavaScript files configuration
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        plugins: {
            prettier: prettier,
        },
        rules: {
            'prettier/prettier': 'error',
        },
    },

    // Ignore patterns
    {
        ignores: ['node_modules/', 'dist/', 'build/'],
    },
];
