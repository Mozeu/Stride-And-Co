const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,

  // App, routes, controllers, bin
  {
    files: ['**/*.js'],
    ignores: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },

  // Tests
  {
    files: ['tests/**/*.js', 'test/e2e/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        process: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },

  {
    ignores: ['tests/**/*.js', 'test/e2e/**/*.js'],
  },
];