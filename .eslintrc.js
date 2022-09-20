module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },

  parserOptions: { sourceType: 'module' },

  overrides: [
    {
      files: ['.eslintrc.js'],
      plugins: ['prettier'],
    },

    {
      files: ['*.ts'],

      parser: '@typescript-eslint/parser',

      extends: [
        'airbnb-base',
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
      ],

      parserOptions: {
        project: ['./tsconfig.json'],
      },

      plugins: ['@typescript-eslint/eslint-plugin', 'import', 'prettier'],

      settings: {
        'import/resolver': {
          node: {
            extensions: ['.ts'],
            paths: ['src'],
          },
        },
      },
      rules: {
        'import/extensions': [
          'error',
          'ignorePackages',
          {
            ts: 'never',
          },
        ],

        camelcase: 'off', // idac habits
        'implicit-arrow-linebreak': 'off', // idac habits
        'import/extensions': 'off', // idac habits
        'import/no-extraneous-dependencies': ['error'], // idac habits
        'import/no-cycle': 'off', // idac habits
        'import/prefer-default-export': 'off', // idac habits
        'max-len': ['warn', { code: 140 }],
        'no-shadow': 'off', // idac habits
        'no-underscore-dangle': 'off', // necessary for graphql convention
        'no-use-before-define': 'off', // idac habits
        'no-useless-constructor': 'off', // idac habits
        '@typescript-eslint/no-useless-constructor': 'error', // idac habits
        '@typescript-eslint/no-shadow': ['error'], // idac habits
        '@typescript-eslint/no-explicit-any': 'off', // idac habits
        '@typescript-eslint/interface-name-prefix': 'off', // idac habits
        '@typescript-eslint/explicit-function-return-type': 'off', // idac habits
      },
    },
    {
      files: ['**/__tests__/*.{t}s?(x)'],
      env: {
        jest: true,
      },
    },
  ],
};