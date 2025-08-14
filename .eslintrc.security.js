module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2021: true
  },
  rules: {
    // Security-focused rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-caller': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-invalid-this': 'error',
    'no-multi-spaces': 'error',
    'no-new-wrappers': 'error',
    'no-throw-literal': 'error',
    
    // Prevent potential security issues
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // TypeScript security rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // Prevent hardcoded secrets
    'no-secrets/no-secrets': 'off' // Would need eslint-plugin-no-secrets
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
