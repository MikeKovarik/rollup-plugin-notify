import babel from 'rollup-plugin-babel'
import notify from 'rollup-plugin-notify'


export default {
	treeshake: false,
	input: 'main.js',
	output: {
		file: `transpiled.js`,
		format: 'umd',
		name: 'my-app',
		globals: {anchora: 'anchora'},
	},
	external: ['anchora'],
	plugins: [
		notify(),
		babel({plugins: ['transform-class-properties']}),
	]
}
