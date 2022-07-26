module.exports = {
  extends: ['ts-important-stuff', 'plugin:prettier/recommended'],
  parser: '@babel/eslint-parser',
  overrides: [
    {
      files: ['**/*.ts?(x)'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint'],
      rules: {
        // Use typescript-eslint rules instead eslint
        'no-unused-vars': 'off',
        'no-redeclare': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],
        '@typescript-eslint/no-redeclare': ['warn'],

        // prettier
        'prettier/prettier': ['error'],
      },
    },
  ],
};
