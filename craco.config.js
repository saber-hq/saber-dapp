const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const invariant = require("tiny-invariant");
const webpack = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const buildStartTS = Math.floor(new Date().getTime() / 1_000);

module.exports = {
  babel: {
    presets: [
      [
        "@babel/preset-react",
        { runtime: "automatic", importSource: "@emotion/react" },
      ],
    ],
    plugins: [
      "babel-plugin-react-icons",
      "@emotion/babel-plugin",
      "babel-plugin-twin",
      "babel-plugin-macros",
      [
        "@simbathesailor/babel-plugin-use-what-changed",
        {
          active: process.env.NODE_ENV === "development", // boolean
        },
      ],
    ],
  },
  webpack: {
    configure: (
      /** @type {import("webpack").Configuration} */
      config,
    ) => {
      invariant(config.plugins, "plugins");
      invariant(config.module?.rules, "rules");

      config.ignoreWarnings = [/Failed to parse source map/];

      // pushing here ensures that the dotenv is loaded
      if (process.env.ANALYZE) {
        config.plugins.push(
          new BundleAnalyzerPlugin({ analyzerMode: "server" }),
        );
      }

      config.resolve = {
        ...config.resolve,
        fallback: {
          assert: false,
          crypto: false,
          stream: false,
        },
      };

      config.plugins.unshift(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        }),
      );
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          url: require.resolve("url/"),
        },
      };

      config.module.rules.push({
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      });

      // solana wallet adapter, ledger need to be transpiled
      config.module.rules.push({
        test: /\.js/,
        loader: require.resolve("babel-loader"),
        include: [/@solana\/wallet-adapter/, /@ledgerhq\/devices/],
      });

      if (process.env.SENTRY_AUTH_TOKEN) {
        config.plugins.push(
          new SentryWebpackPlugin({
            // sentry-cli configuration
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            release: process.env.REACT_APP_SENTRY_RELEASE ?? "unknown",

            // webpack specific configuration
            include: "./build/",
            ignore: ["node_modules"],
            setCommits: {
              repo: process.env.GITHUB_REPO,
              commit:
                process.env.GITHUB_SHA ??
                process.env.COMMIT_REF ??
                process.env.CF_PAGES_COMMIT_SHA,
            },
            deploy: {
              env: process.env.REACT_APP_SENTRY_ENV ?? "unknown",
              started: buildStartTS,
            },
          }),
        );
      }

      return config;
    },
  },
  eslint: {
    enable: false,
  },
  typescript: { enableTypeChecking: false },
};
