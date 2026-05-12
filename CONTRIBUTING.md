# Contributing to RiteForge

Thank you for your interest in contributing to RiteForge! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (browser, OS, etc.)

### Suggesting Features

Feature requests are welcome! Please:
- Check if the feature already exists
- Describe the use case clearly
- Explain why it would benefit users

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Test all changes locally
- Ensure the app builds without errors
- Test on Ritual testnet before submitting

### Adding Contract Templates

To add a new template to the library:

1. Add to `lib/contract-templates.ts`
2. Include proper category, difficulty, and tags
3. Ensure code compiles with Hardhat
4. Test deployment on Ritual testnet
5. Add clear description and use case

## Development Setup

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Compile contracts
npx hardhat compile

# Run tests (if available)
pnpm test
```

## Questions?

Feel free to reach out:
- Twitter: [@rdmnad](https://x.com/rdmnad)
- Discord: @therdm

Thank you for contributing! 🚀
