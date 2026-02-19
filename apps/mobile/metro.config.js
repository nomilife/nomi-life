const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ENOENT (@angular-devkit/inquirer_tmp) önleme: sadece mobile + gerekli root modüller izlensin
const monorepoRoot = path.resolve(__dirname, '../..');
config.watchFolders = [
  path.resolve(__dirname),
  path.join(monorepoRoot, 'node_modules', 'react'),
  path.join(monorepoRoot, 'node_modules', 'react-dom'),
];

// Package exports gerekli: @expo/metro-runtime/symbolicate
config.resolver.unstable_enablePackageExports = true;

// Subpath @expo/metro-runtime/symbolicate -> build/symbolicate (TS source)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@expo/metro-runtime/symbolicate') {
    const mr = path.dirname(require.resolve('@expo/metro-runtime/package.json'));
    const target = path.join(mr, 'src', 'symbolicate.ts');
    return { type: 'sourceFile', filePath: target };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Force single React instance (monorepo)
config.resolver.extraNodeModules = {
  react: path.resolve(monorepoRoot, 'node_modules/react'),
  'react-dom': path.resolve(monorepoRoot, 'node_modules/react-dom'),
};

module.exports = config;
