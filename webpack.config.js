const path = require('path');
const { merge } = require('webpack-merge');
const singleSpaDefaults = require('webpack-config-single-spa-ts');

module.exports = (webpackConfigEnv, argv) => {
  const opts = {
    orgName: 'tgyou',
    projectName: 'single-spa-transition',
    webpackConfigEnv,
    argv,
  };

  return [
    merge(singleSpaDefaults(opts), {
      entry: path.resolve(process.cwd(), `src/${opts.projectName}`),
      output: {
        filename: `${opts.projectName}.js`,
        libraryTarget: 'system',
        path: path.resolve(process.cwd(), 'lib/system'),
        uniqueName: opts.projectName,
        devtoolNamespace: `${opts.projectName}`,
        publicPath: '',
      },
    }),
    merge(singleSpaDefaults(opts), {
      entry: path.resolve(process.cwd(), `src/${opts.projectName}`),
      output: {
        filename: `${opts.projectName}.js`,
        libraryTarget: 'umd',
        path: path.resolve(process.cwd(), 'lib/umd'),
        uniqueName: opts.projectName,
        devtoolNamespace: `${opts.projectName}`,
        publicPath: '',
      },
    }),
    merge(singleSpaDefaults(opts), {
      entry: path.resolve(process.cwd(), `src/${opts.projectName}`),
      output: {
        filename: `${opts.projectName}.cjs`,
        libraryTarget: 'commonjs',
        path: path.resolve(process.cwd(), 'lib/cjs'),
        uniqueName: opts.projectName,
        devtoolNamespace: `${opts.projectName}`,
        publicPath: '',
      },
    }),
  ];
};
