'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// ENV: 'dev', 'dist'
const ENV = {
	production: 'production',
	development: 'development'
};

const isDev = process.env.NODE_ENV !== ENV.production;

const definePlugins = {
	'process.env.version': new Date().getTime(),
	'process.env.NODE_ENV': JSON.stringify(isDev ? ENV.development : ENV.production)
};

// Default plugins
let plugins = [
	new webpack.DefinePlugin(definePlugins),
	// Lint CSS
	new StyleLintPlugin({
		files: 'static_src/css/**/*.css'
	}),
	new ExtractTextPlugin({
		filename: '[name].css',
		allChunks: true 
	})
];

if (!isDev) {
	// Dist plugins
	plugins = plugins.concat([
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': '"production"'
		}),
		new UglifyJSPlugin({
			compress: {
				drop_console: true  //убрать сonsole.log
			}
		}),
		new webpack.optimize.AggressiveMergingPlugin()
	]);
}

module.exports = {
	entry: {
		main : './static_src/js/main.js'
	},
	output: {
		path: path.join(__dirname, 'static'),
		publicPath: '/static/',
		filename: '[name].js'
	},
	module: {
		rules: [
			// JS
			{
				test: /\.js$/,
				loader: 'babel-loader'
			},
			{
				test: /\.js$/,
				use: [{
					loader: 'eslint-loader',
					options: {
						configFile: path.join(__dirname, '.eslintrc'),
						rules: {semi: 0}
					},
				}],
				enforce: 'pre',
				exclude: /(node_modules)/
			},
			// CSS
			{
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
					fallback: [
						{   loader: 'style-loader',
					    	options: {
					      		modules: true
					    	}
						}
					],
	                use: [
		                'css-loader',
		                {
							loader: 'postcss-loader',
							options: {
								plugins: function () {
									const cssDir = path.dirname(this.resource).split(path.sep);
									const widgetName = cssDir[cssDir.length - 3];

									if (isDev) {
										return [
											// postcss-import for webpack watch
											require('postcss-import')(),
											require('precss')(),
											require('postcss-initial')(),
											require('postcss-assets')(),
											require('autoprefixer')({browsers: ['last 2 versions', 'ie >= 11'], cascade: false})
										];
									}
									return [
										require('precss')(),
										require('postcss-initial')(),
										require('postcss-assets')(),
										require('autoprefixer')({browsers: ['last 2 versions', 'ie >= 11'], cascade: false}),
										// Minimize CSS build
										require('postcss-csso')()
									];
								}
							}
						}
	                ]
	            })
			},
			// Copy images
			{
				test: /\.(png|jpg|gif|svg)/,
				loader: "file-loader?name=[hash:6].[ext]"
			},
			// Copy fonts
			{
				test: /\.(woff2?|ttf|eot)/,
				loader: ['file-loader']
			}
		]
	},
	devtool: 'sourcemap',
	plugins: plugins,
	resolve: {
		extensions: ['.js', '.css'],
		modules: ['./static_src', './node_modules'],
		alias: {
			node_modules: path.join(__dirname, 'node_modules'),
			'vue$': 'vue/dist/vue.common.js'
		}
	}
};
