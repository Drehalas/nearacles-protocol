# Nearacles Protocol

A decentralized oracle protocol for credibility evaluation and fact-checking, extracted and refined from the gbcw-protocol-rebels hackathon project.

## Features

- **Credibility Evaluation**: AI-powered fact-checking using real-time web search
- **Refutation System**: Adversarial validation through counter-evidence gathering
- **Source Validation**: URL normalization, deduplication, and reliability scoring
- **TypeScript**: Fully typed for better developer experience
- **Modular Architecture**: Clean separation of concerns

## Core Components

### Oracle Service
Main service combining credibility evaluation and refutation capabilities.

### Credibility Service
Evaluates yes/no questions using OpenAI's web search capabilities.

### Refutation Service
Challenges existing evaluations by finding counter-evidence.

### Source Validation
Utilities for validating, normalizing, and categorizing information sources.

## Usage

```typescript
import { OracleService } from 'nearacles-protocol';

const oracle = new OracleService(process.env.OPENAI_API_KEY);

// Evaluate a question
const evaluation = await oracle.evaluate("Is Bitcoin trading above $50,000?");

// Refute the evaluation
const refutation = await oracle.refute(evaluation);

// Combined evaluation with immediate refutation
const { evaluation, refutation } = await oracle.evaluateWithRefutation(
  "Is climate change caused by human activity?"
);
```

## Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development with watch mode
npm run dev

# Type checking
npm run type-check

# Run tests
npm test
```

## Architecture

The system follows a clean architecture with:

- **Types**: TypeScript interfaces and types
- **Services**: Core business logic
- **Utils**: Shared utilities and helpers

All components are designed to be stateless and composable for maximum flexibility.