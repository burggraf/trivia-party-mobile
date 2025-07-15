const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper asset handling in production builds
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

module.exports = config;