module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  moduleDirectories: ['node_modules', '<rootDir>/../node_modules'],
  testPathIgnorePatterns: ['/node_modules/', '/frontend/'],
  testEnvironment: 'node',
};
