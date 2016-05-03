'use strict';
const path = require('path');

module.exports = {
  entry: './scripts/index.js',
  output: {
	path: path.join(__dirname, 'build'),
	filename: 'main.js'
  },
  loaders: [
    {
      test: /\.js?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel', // 'babel-loader' is also a legal name to reference
      query: {
        presets: ['es2015']
      }
    }
  ]
};
