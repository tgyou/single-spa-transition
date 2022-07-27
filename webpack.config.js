const singleSpaDefaults = require('webpack-config-single-spa-ts');
const createMerge = require('./webpack.merge');

module.exports = (webpackConfigEnv, argv) => {
  const opts = {
    orgName: 'tgyou',
    projectName: 'single-spa-transition',
    webpackConfigEnv,
    argv,
  };

  const createConfig = createMerge(opts, singleSpaDefaults);

  return webpackConfigEnv.WEBPACK_BUILD && !webpackConfigEnv.analyze
    ? [createConfig('esm'), createConfig('system'), createConfig('commonjs'), createConfig('umd')]
    : createConfig('system');
};
