const { defineConfig, globalIgnores } = require('eslint/config');

const tsParser = require('@typescript-eslint/parser');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const prettier = require('eslint-plugin-prettier');
const globals = require('globals');
const js = require('@eslint/js');

const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

module.exports = defineConfig([
    {
        languageOptions: {
            parser: tsParser,
            sourceType: 'module',
            ecmaVersion: 2020,

            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },

            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },

        plugins: {
            '@typescript-eslint': typescriptEslint,
            prettier,
        },

        extends: compat.extends(
            'eslint:recommended',
            'plugin:@typescript-eslint/recommended',
            'plugin:prettier/recommended',
            'prettier',
        ),

        rules: {
            'prettier/prettier': [
                'error',
                {
                    singleQuote: true,
                    printWidth: 120,
                    tabWidth: 4,
                    trailingComma: 'all',
                    endOfLine: 'auto',
                },
            ],

            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',

            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                },
            ],

            'no-console': 'warn',
            'no-implicit-coercion': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
        },
    },
    globalIgnores(['**/dist/', '**/build/', '**/node_modules/', '**/*.js', '**/*.d.ts']),
]);
