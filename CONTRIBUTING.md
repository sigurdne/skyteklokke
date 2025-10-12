# Contributing to SkyteKlokke

Thank you for your interest in contributing to SkyteKlokke! This document provides guidelines for contributing to the project.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include device information and app version**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **Include mockups or examples if applicable**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the project's coding style
5. Write a clear commit message describing your changes

## Development Setup

1. Install Node.js (v18 or higher)
2. Install Expo CLI: `npm install -g @expo/cli`
3. Clone your fork: `git clone https://github.com/sigurdne/skyteklokke.git`
4. Install dependencies: `npm install`
5. Start development: `npx expo start`

## Coding Standards

- Use TypeScript for type safety
- Follow React Native and Expo best practices
- Write clear, descriptive commit messages
- Include comments for complex logic
- Ensure audio timing precision for shooting commands

## Translation Contributions

We welcome translations for additional languages! Please:

1. Check existing language files in `src/i18n/locales/`
2. Follow the established translation structure
3. Ensure shooting terminology is accurate for your region
4. Test audio pronunciation with text-to-speech

## Questions?

Feel free to open an issue for questions about contributing!