const path = require('path');
const { merge } = require('webpack-merge');

const createMergeLibraryTarget = (opts, createCallback, options) => {
  options = merge({ outDir: './lib' }, options || {});

  return function (libraryTarget = 'system', _config) {
    let outputPath = `${libraryTarget}`;
    let extension = 'js';

    if (libraryTarget === 'commonjs') {
      outputPath = 'cjs';
      extension = 'cjs';
    }

    const config = merge(createCallback(opts), {
      entry: path.resolve(process.cwd(), `src/${opts.projectName}`),
      output: {
        filename: `${opts.projectName}.${extension}`,
        libraryTarget,
        path: path.resolve(process.cwd(), `${options.outDir}/${outputPath}`),
      },
    });

    if (libraryTarget === 'esm') {
      config.output.enabledLibraryTypes = ['module'];
      config.output.libraryTarget = 'module';
      config.experiments = {
        outputModule: true,
      };
    }

    if (libraryTarget !== 'system') {
      config.plugins = config.plugins?.filter(plugin => plugin.constructor.name !== 'SystemJSPublicPathWebpackPlugin');
    }

    return merge(config, _config || {});
  };
};

module.exports = createMergeLibraryTarget;
