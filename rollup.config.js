import { nodeResolve } from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-import-css';

export default {
 input: 'src/compare-slider.js',
 output: {
  file: 'assets/compare-slider.js',
  format: 'iife',
 },
 plugins: [nodeResolve(), css()],
};
