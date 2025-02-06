export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    // '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
};
