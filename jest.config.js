module.exports = {
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['js'],
    testMatch: ['**/tests/**/*.test.js'],
    setupFiles: ['./jest.setup.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    verbose: true
}; 