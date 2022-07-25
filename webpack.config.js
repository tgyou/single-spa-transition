const path = require('path');
const { merge } = require('webpack-merge');
const singleSpaDefaults = require('webpack-config-single-spa-ts');

module.exports = (webpackConfigEnv, argv) => {
  const opts = {
    orgName: 'styx',
    projectName: 'single-spa-transition',
    webpackConfigEnv,
    argv,
  };

  return merge(singleSpaDefaults(opts), {
    entry: path.resolve(process.cwd(), `src/${opts.projectName}`),
    output: {
      filename: `${opts.projectName}.js`,
      libraryTarget: 'system',
      path: path.resolve(process.cwd(), 'dist'),
      uniqueName: opts.projectName,
      devtoolNamespace: `${opts.projectName}`,
      publicPath: '',
    },
  });
};
