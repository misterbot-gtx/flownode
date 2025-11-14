import { readFileSync } from 'fs';
import { resolve } from 'path';
import { cwd } from 'process';
import { defineConfig } from 'rollup';
import resolvePlugin from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import typescript from '@rollup/plugin-typescript';

const pkg = JSON.parse(readFileSync(resolve(cwd(), './package.json')));
const isProd = process.env.NODE_ENV === 'production';

const defaultPlugins = [
  resolvePlugin({
    preferBuiltins: false,
    exportConditions: ['import', 'module', 'default'],
    dedupe: ['@flow/system'],
  }),
  commonjs({
    include: /node_modules/,
  }),
];

const onwarn = (warning, rollupWarn) => {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    rollupWarn(warning);
  }
};

// Helper function to check if a package is a workspace dependency
const isWorkspaceDependency = (id) => {
  return id === '@flow/system' || id.startsWith('@flow/system/');
};

const defineEsmConfig = (format) =>
  defineConfig({
    input: pkg.source,
    output: {
      file: format === 'js' ? pkg.module : pkg.module.replace('.js', '.mjs'),
      format: 'esm',
      banner: pkg.rollup?.vanilla ? undefined : '"use client"',
    },
    external: (id) => {
      // Mark workspace dependencies as external
      if (isWorkspaceDependency(id)) {
        return true;
      }
      return false;
    },
    onwarn,
    plugins: [
      peerDepsExternal({
        includeDependencies: true,
      }),
      ...defaultPlugins,
      typescript({
        tsconfig: resolve(cwd(), './tsconfig.json'),
        declaration: false,
        declarationMap: false,
        rootDir: resolve(cwd(), './src'),
      }),
    ],
  });

const reactGlobals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react/jsx-runtime': 'jsxRuntime',
};

const globals = {
  ...(pkg.rollup?.vanilla ? {} : reactGlobals),
  ...(pkg.rollup?.globals || {}),
  // Add workspace dependencies to globals for UMD builds
  ...(pkg.dependencies?.['@flow/system'] || pkg.peerDependencies?.['@flow/system']
    ? { '@flow/system': 'XYFlowSystem' }
    : {}),
};

const esmMjsConfig = defineEsmConfig('mjs');
const esmJsConfig = defineEsmConfig('js');

const umdConfig = defineConfig({
  input: pkg.source,
  output: {
    file: pkg.main,
    format: 'umd',
    exports: 'named',
    name: pkg.rollup?.name || 'ReactFlow',
    globals,
  },
  external: (id) => {
    // Mark workspace dependencies as external
    if (isWorkspaceDependency(id)) {
      return true;
    }
    return false;
  },
  onwarn,
  plugins: [
    peerDepsExternal(),
    ...defaultPlugins,
    typescript({
      tsconfig: resolve(cwd(), './tsconfig.json'),
      declaration: false,
      declarationMap: false,
      rootDir: resolve(cwd(), './src'),
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    terser(),
  ],
});

export default isProd ? [esmMjsConfig, esmJsConfig, umdConfig] : [esmJsConfig, esmMjsConfig];
