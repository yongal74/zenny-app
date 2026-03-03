const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Replit 리버스 프록시 환경에서 Metro 호스트 검증 우회
// Expo Go → Replit URL → gateway → Metro 흐름에서 host 헤더가 거부되는 문제 해결
if (process.env.REPL_ID) {
  config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        req.headers['host'] = 'localhost';
        return middleware(req, res, next);
      };
    },
  };
}

module.exports = config;
