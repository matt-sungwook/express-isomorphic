"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const del_1 = require("del");
const path = require("path");
const webpack_1 = require("webpack");
const webpack_dev_middleware_1 = require("webpack-dev-middleware");
const webpack_hot_middleware_1 = require("webpack-hot-middleware");
const createExpress_1 = require("./createExpress");
const serverUtils_1 = require("./utils/serverUtils");
const log_1 = require("./utils/log");
const tag = '[localServer]';
let webpackStats = undefined;
const localServer = function ({ makeHtml, publicPath, serverDistPath, webpackConfigClientLocalPath, webpackConfigUniversalLocalPath, webpackStats, }) {
    return createExpress_1.default({
        enhance: (app, state) => {
            log_1.log(`${tag}
serverDistPath: %s
webpackConfigClientLocalPath: %s
webpackConfigUniversalLocal: %s
webpackStats: %o`, serverDistPath, webpackConfigClientLocalPath, webpackConfigUniversalLocalPath, webpackStats);
            setupWatchingWebpackUniversalCompiler({
                serverDistPath,
                state,
                webpackConfigUniversalLocalPath,
                webpackStats,
            });
            const webpackConfigClientLocalWeb = require(webpackConfigClientLocalPath);
            log_1.log(`${tag} webpack-client-local will be compiled with config:\n%o`, webpackConfigClientLocalWeb);
            const clientWebpackCompiler = webpack_1.default(webpackConfigClientLocalWeb);
            const devMiddleware = webpack_dev_middleware_1.default(clientWebpackCompiler, {
                publicPath: webpackConfigClientLocalWeb.output.publicPath,
                serverSideRender: true,
                stats: webpackStats,
            });
            const hotMiddleware = webpack_hot_middleware_1.default(clientWebpackCompiler, {
                heartbeat: 2000,
                reload: true,
            });
            app.use(devMiddleware);
            app.use(hotMiddleware);
            app.use((req, res, next) => {
                if (state.buildHash !== res.locals.webpackStats.hash) {
                    const info = res.locals.webpackStats.toJson(webpackStats);
                    const { error, assets } = serverUtils_1.parseWebpackBuildInfo(info);
                    state.update(Object.assign({ assets, buildHash: res.locals.webpackStats.hash }, error && { error }, { isLaunched: true }));
                }
                next();
            });
        },
        makeHtml,
        publicPath,
    });
};
exports.default = localServer;
function setupWatchingWebpackUniversalCompiler({ serverDistPath, state, webpackConfigUniversalLocalPath, webpackStats, }) {
    const webpackConfig = require(webpackConfigUniversalLocalPath);
    del_1.default.sync([
        serverDistPath,
    ]);
    log_1.log(`${tag} [watch] webpack-universal-local will be compiled with config:\n%o`, webpackConfig);
    const serverWebpackCompiler = webpack_1.default(webpackConfig);
    const watchOptions = {
        aggregateTimeout: 2000,
        poll: undefined,
    };
    serverWebpackCompiler.watch(watchOptions, (err, stats) => {
        if (err || stats.hasErrors()) {
            const error = stats.toString('errors-only');
            log_1.log(`${tag} [watch] [error] webpack-universal-local watch() ${chalk_1.default.red('fails')}:\n%s`, error);
            state.update({
                error,
            });
        }
        else {
            const info = stats.toJson(webpackStats);
            log_1.log(`${tag} [watch] webpack-universal-local watch() ${chalk_1.default.green('success')}: at: %s,\n%o`, new Date(), info);
            // fs.writeFileSync(`${paths.distServer}/build.json`, JSON.stringify(info, null, 2));
            delete require.cache[state.universalAppPath];
            log_1.log(`${tag} [watch] require cache after deleting universalAppPath (%s):\n%o`, state.universalAppPath, serverUtils_1.getProperRequireCache());
            const universalAppPath = path.resolve(serverDistPath, 'universal.local.rootContainer.js');
            state.update({
                error: undefined,
                universalAppPath,
            });
        }
    });
}
