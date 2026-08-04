import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['lib/']
    },
    {
        files: ['src/**/*.ts', 'test/**/*.ts'],
        extends: [
            ...tseslint.configs.recommended
        ],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json'
            }
        },
        rules: {
            'semi': ['warn', 'always'],
            'quotes': ['warn', 'single', { avoidEscape: true }],
            'indent': ['warn', 4, { SwitchCase: 1 }],
            'comma-dangle': ['warn', 'never'],
            'prefer-const': 'warn',
            'no-var': 'warn',
            'eqeqeq': ['warn', 'smart'],
            'no-eval': 'warn',
            'use-isnan': 'warn',
            'curly': ['warn', 'multi-line'],
            'no-unsafe-finally': 'warn',
            'no-multiple-empty-lines': ['warn', { max: 1 }],
            'new-parens': 'warn',
            'radix': 'warn',
            'spaced-comment': ['warn', 'always'],
            'arrow-parens': ['warn', 'as-needed'],
            'no-trailing-spaces': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-require-imports': 'off',
            'no-restricted-syntax': ['warn', {
                selector: 'ExportDefaultDeclaration',
                message: 'Prefer named exports'
            }]
        }
    },
    {
        files: ['test/**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off'
        }
    }
);
