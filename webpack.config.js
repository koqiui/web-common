var path = require('path');
var webpack = require('webpack')

var entryMap = require('./webpack.entry.js');

function resolvePath(dir) {
    return path.join(__dirname, './', dir)
}

module.exports = {
    entry: entryMap,

    output: {
        path: resolvePath('dist'),
        publicPath: '/dist/',
        filename: '[name].js'
    },

    resolve: {
        extensions: ['.js', '.es6']
    },

    module: {
        rules: [
            {
                test: /\.(js|es6)$/,
                loader: 'babel-loader',
                exclude: [/node_modules/, resolvePath('test')],
                include: [resolvePath('src')]
            }
        ]
    }
}
