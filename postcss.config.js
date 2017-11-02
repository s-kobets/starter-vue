module.exports = {
	plugins: [
		require('precss')(),
		require('postcss-import')(),
		require('cssnano')()
	],
	cssSourceMap: false
};
