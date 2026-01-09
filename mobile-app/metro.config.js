const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Enable Package Exports (Critical for viem v2)
config.resolver.unstable_enablePackageExports = true;

// 2. Strict Condition Names: Only 'react-native' and 'require' (Force CJS where available)
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];

// 3. Extension Priority: Prefer 'cjs' if available
config.resolver.sourceExts = ['cjs', 'mjs', ...config.resolver.sourceExts.filter(ext => ext !== 'cjs' && ext !== 'mjs')];

// 4. Custom Resolver: Fix 'ox' imports AND force CJS redirects
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // A. Fix 'ox' importing .js instead of .ts in node_modules
  if (context.originModulePath.includes('node_modules') && moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    return context.resolveRequest(context, moduleName.replace(/\.js$/, ''), platform);
  }

  // B. Fallback to standard resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
