const path = require("path");

module.exports = {
  target: "node",
  mode: "production",
  entry: {
    cli: "./src/cli.ts",
    index: "./src/index.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
    library: {
      type: "commonjs2",
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    // Don't bundle AWS SDK and other large dependencies
    "@aws-sdk/client-s3": "@aws-sdk/client-s3",
    inquirer: "inquirer",
    commander: "commander",
  },
  target: "node",
  node: {
    __dirname: false,
    __filename: false,
  },
  optimization: {
    minimize: false, // Keep readable for debugging
  },
  plugins: [
    // Add shebang to CLI file
    {
      apply: (compiler) => {
        compiler.hooks.emit.tapAsync(
          "AddShebangPlugin",
          (compilation, callback) => {
            const cliAsset = compilation.assets["cli.js"];
            if (cliAsset) {
              const originalSource = cliAsset.source();
              const sourceWithShebang = `#!/usr/bin/env node\n${originalSource}`;
              compilation.assets["cli.js"] = {
                source: () => sourceWithShebang,
                size: () => sourceWithShebang.length,
              };
            }
            callback();
          }
        );
      },
    },
  ],
};
