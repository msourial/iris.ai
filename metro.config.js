const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Force CJS resolution for @babel/runtime helpers.
// Metro's package-exports resolver uses the "import" condition which maps
// helpers/interopRequireDefault → helpers/esm/interopRequireDefault.js (ESM).
// That ESM file exports `export default function`, so require() returns
// { default: fn } (an Object) instead of the function itself →
// "_interopRequireDefault is not a function" crash in Hermes.
// Fix: intercept those requires and return the explicit CJS file path.
const babelRuntimeHelpers = path.resolve(
  __dirname,
  "node_modules/@babel/runtime/helpers"
);
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith("@babel/runtime/helpers/") &&
    !moduleName.includes("/esm/")
  ) {
    const helperName = moduleName.replace("@babel/runtime/helpers/", "");
    const cjsPath = path.join(babelRuntimeHelpers, helperName + ".js");
    return { filePath: cjsPath, type: "sourceFile" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Shim Node.js built-ins required by @onflow/fcl → @walletconnect/core
// Also pin tslib so Metro resolves it to the correct CJS version
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve("crypto-browserify"),
  stream: require.resolve("stream-browserify"),
  events: require.resolve("events"),
  tslib: require.resolve("tslib"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
