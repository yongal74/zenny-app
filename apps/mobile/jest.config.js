/** @type {import('jest').Config} */
module.exports = {
  // babel-jest로 TS 변환 (babel-preset-expo 사용)
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  testEnvironment: 'node',
  // 순수 유틸 테스트만 대상 (RN 컴포넌트 제외)
  testMatch: ['**/__tests__/**/*.test.ts'],
  // node_modules 제외 (expo 내부 포함)
  transformIgnorePatterns: [],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // 모듈 경로 별칭 없음 (절대경로 임포트 미사용)
};
