import coreWebVitals from 'eslint-config-next/core-web-vitals';

/** ESLint 9 (flat config) con el preset de Next 16. */
const config = [
  {
    ignores: ['.next/**', 'out/**', 'next-env.d.ts', 'prisma/**', 'scripts/**'],
  },
  ...coreWebVitals,
  {
    rules: {
      '@next/next/no-img-element': 'warn',
    },
  },
];

export default config;
