const rollup = require('rollup')
const notify = require('rollup-plugin-notify')


rollup.rollup({
	input: 'main.js',
	output: {
		file: 'transpiled.js',
		format: 'cjs',
	},
	plugins: [
		notify()
	]
})
.catch(err => console.log('rollup failed', err))
