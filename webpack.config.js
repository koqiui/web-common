var path = require('path');
var webpack = require('webpack');

var entryMap = require('./webpack.entry.js');

function resolvePath(dir) {
    return path.join(__dirname, './', dir)
}

module.exports = {
    entry: entryMap,

    output: {
        path: resolvePath('lib'),
        publicPath: '/lib/',
        filename: '[name].js'
    },

    resolve: {
        extensions: ['.es6', '.js']
    },

    module: {
        rules: [
            {
                test: /\.(es6|js)$/,
                loader: 'babel-loader',
                exclude: [/node_modules/],
                include: [resolvePath('src')]
            }
        ]
    }
};
