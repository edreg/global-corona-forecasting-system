var Encore = require('@symfony/webpack-encore');
const CompressionPlugin = require('compression-webpack-plugin');

// Manually configure the runtime environment if not already configured yet by the "encore" command.
// It's useful when you use tools that rely on webpack.config.js file.
if (!Encore.isRuntimeEnvironmentConfigured()) {
    Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}

Encore
    // directory where compiled assets will be stored
    .setOutputPath(Encore.isProduction() ? 'data/webpack/build/' : 'public/build/')//'public/build/'
    // public path used by the web server to access the output path
    .setPublicPath(Encore.isProduction() ? '/build' : '/global-corona-forecasting-system/public/build')
    // only needed for CDN's or sub-directory deploy
    //.setManifestKeyPrefix('build/')

    /*
     * ENTRY CONFIG
     *
     * Add 1 entry for each "page" of your app
     * (including one that's included on every page - e.g. "app")
     *
     * Each entry will result in one JavaScript file (e.g. app.js)
     * and one CSS file (e.g. app.css) if your JavaScript imports CSS.
     */
    .addEntry('app', './assets/js/app.js')
    .addEntry('map', './assets/ts/map/map.ts')


    //.addEntry('page1', './assets/js/page1.js')
    //.addEntry('page2', './assets/js/page2.js')

    // When enabled, Webpack "splits" your files into smaller pieces for greater optimization.
    .splitEntryChunks()

    // will require an extra script tag for runtime.js
    // but, you probably want this, unless you're building a single-page app
    .enableSingleRuntimeChunk()

    /*
     * FEATURE CONFIG
     *
     * Enable & configure other features below. For a full
     * list of features, see:
     * https://symfony.com/doc/current/frontend.html#adding-more-features
     */
    .cleanupOutputBeforeBuild()
    .enableBuildNotifications()
    .enableSourceMaps(!Encore.isProduction())
    // enables hashed filenames (e.g. app.abc123.css)
    .enableVersioning(Encore.isProduction())

    // enables @babel/preset-env polyfills
    .configureBabelPresetEnv((config) => {
        config.useBuiltIns = 'usage';
        config.corejs = 3;
    })

    // enables Sass/SCSS support
    .enableSassLoader()

    // uncomment if you use TypeScript
    //.enableTypeScriptLoader()
    .enableTypeScriptLoader(function(tsConfig) {
        // You can use this callback function to adjust ts-loader settings
        // https://github.com/TypeStrong/ts-loader/blob/master/README.md#loader-options
        // For example:
        // tsConfig.silent = false
        tsConfig.transpileOnly = true;
        tsConfig.configFile = './tsconfig.json';
    })

    // uncomment to get integrity="..." attributes on your script & link tags
    // requires WebpackEncoreBundle 1.4 or higher
    //.enableIntegrityHashes(Encore.isProduction())

    // uncomment if you're having problems with a jQuery plugin
    .autoProvidejQuery()

    //
    // .copyFiles({
    //         from: './node_modules/bootstrap',
    //         to: 'dist/bootstrap/[path][name].[ext]'
    //         //to: 'components/bootstrap/[path][name].[hash:8].[ext]'
    // })
    // .copyFiles({
    //         from: './node_modules/jquery-ui',
    //         to: 'dist/jquery-ui/[path][name].[ext]'
    // })
    // .copyFiles({
    //         from: './node_modules/jquery-ui-dist',
    //         to: 'dist/jquery-ui-dist/[path][name].[ext]'
    // })
    // .copyFiles({
    //         from: './node_modules/echarts',
    //         to: 'dist/echarts/[path][name].[ext]'
    // })
    // .copyFiles({
    //         from: './node_modules/echarts-gl',
    //         to: 'dist/echarts-gl/[path][name].[ext]'
    // })


    // uncomment if you use API Platform Admin (composer req api-admin)
    //.enableReactPreset()
    //.addEntry('admin', './assets/js/admin.js')

;

module.exports = Encore.getWebpackConfig();
