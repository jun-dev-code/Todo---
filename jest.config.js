module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '<rootDir>/tests/**/*.test.js',
        '<rootDir>/src/**/*.test.js'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/main.js',
        '!**/node_modules/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    moduleNameMapping: {
        '\\.(css|less|scss)$': 'identity-obj-proxy'
    }
};