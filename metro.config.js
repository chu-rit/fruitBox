const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web에서 react-native-google-mobile-ads를 빈 mock으로 처리
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-google-mobile-ads') {
    return {
      filePath: require.resolve('./src/mocks/adsMock.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
