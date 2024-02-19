// import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import svgr from '@svgr/rollup'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

import pkg from './package.json'

export default [
  {
    input: 'src/index.tsx',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      external(),
      postcss({
        modules: true
      }),
      url(),
      svgr(),
      resolve(),
      commonjs({
        include: 'node_modules/**',
        namedExports: {
          'node_modules/pts/dist/es5.js': ['CanvasSpace']
        }
      })
    ]
  },
  {
    input: './dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()]
  }
]
