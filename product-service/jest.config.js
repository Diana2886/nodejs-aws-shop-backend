module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/handlers/'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
