const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const WooCommerceDependencyExtractionWebpackPlugin = require('@woocommerce/dependency-extraction-webpack-plugin');
const path = require('path');

module.exports = {
    ...defaultConfig,
    entry: {
        'frontend/mobile-footer': '/src/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'assets'),
        filename: '[name].js',
    },
    plugins: [
    ...defaultConfig.plugins.filter(
        ( plugin ) =>
        plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
    ),
        new WooCommerceDependencyExtractionWebpackPlugin(),
    ],
};
