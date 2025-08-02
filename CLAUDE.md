use context7

# CLAUDE.md

This file provides personalized guidance for Claude Code (claude.ai/code) when working with TypeScript/Node.js projects for this user.

## General TypeScript Projects Overview

These guidelines apply broadly to all of your TypeScript projects regardless of framework or tooling, designed to keep code clean, maintainable, and consistent.

## Development Environment

- Use Node.js 18+ and TypeScript 5.0+ for all projects (take advantage of modern language features and typing improvements).
- Use your preferred package manager consistently (e.g., npm, yarn, pnpm, or bun).
- Maintain proper dependency separation between dependencies and devDependencies.

## Common Commands (Adapt as Needed)

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Add new dependencies
npm install <package>
npm install -D <package> # for dev dependencies

# Run development server
npm run dev

# Build project
npm run build

# Run tests
npm test

# Type checking
npm run type-check
# or
tsc --noEmit
```

## Code Style and Best Practices

### Clean Code Principles

• Write self-documenting code with clear, descriptive variable and function names.
• Define small functions focused on a single responsibility.
• Prefer explicit and straightforward code over clever or implicit constructs.
• Names should reveal intent clearly.

### DRY (Don't Repeat Yourself)

• Identify common functionality and extract it into reusable functions, classes, or modules.
• Use constants for repeated literals or magic values.
• Avoid duplicated logic; centralize common behavior.

### TypeScript Types (Modern Style)

• Use strict TypeScript configuration with strict mode enabled.
• Prefer type assertions with `as` over angle bracket syntax.
• Use union types with `|`, e.g., `string | null` instead of optional chaining where appropriate.
• Leverage utility types: `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`.
• Never relax type hints to an extent that we have to use `any`, ever!!! Whenever you feel you need to make a function input or output an object, you should create proper interfaces or types for it.
• Use `const assertions` with `as const` for immutable data structures.

### Control Flow

• Use guard clauses and early returns to reduce nesting.
• Avoid multiple nested conditionals by extracting complex boolean expressions into well-named functions.
• Example:
  ```typescript
  function isValidUser(user: User): boolean {
    return user.isActive && user.emailVerified && user.hasPermission();
  }

  if (!isValidUser(user)) {
    return;
  }
  ```

### Loop Handling

• Extract complex loop logic into separate helper functions for clarity and testing.
• Use array methods like `map`, `filter`, `reduce` where appropriate for functional programming style.
• Prefer `for...of` over traditional for loops for iteration.

### Indentation and Nesting

• Keep nesting shallow (recommended max 2-3 levels).
• Prefer flat code structure over deeply nested code blocks.
• Use early returns and function extraction to reduce indentation levels.

### Error Handling

• Use proper error handling with try/catch blocks.
• Create custom error types when appropriate.
• Avoid catching errors only to ignore them; let unexpected errors propagate for debugging.

### Comments and Documentation

• Favor clear code over comments; add comments sparingly when the intent or rationale is not obvious.
• Document public interfaces, classes, and functions with JSDoc comments.
• Use `/** */` for function/class documentation that appears in IDE tooltips.

## Project Structure (General Recommendations)

• Organize source code under a `src/` directory.
• Keep tests alongside source files or in a separate `tests/` directory.
• Use `package.json` and `tsconfig.json` for project configuration.
• Use version control roots and ignore node_modules and build artifacts.

## Example Project Layout

```
project-root/
├── src/                  # TypeScript source code
│   ├── index.ts
│   ├── types/           # Type definitions
│   ├── utils/           # Utility functions
│   └── components/      # Components (if applicable)
├── tests/               # Test suite (or __tests__ alongside source)
│   └── index.test.ts
├── dist/                # Build output (ignored in VCS)
├── node_modules/        # Dependencies (ignored in VCS)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── README.md
└── .gitignore
```

## Framework-Integration Test

Add a simple integration test script to verify that your environment and main dependencies are correctly installed and working.

```typescript
/**
 * Framework-integration-test for TypeScript projects.
 * 
 * This script tests:
 * - Basic TypeScript features and type checking
 * - Core dependency functionality if installed
 * 
 * Usage:
 * ```bash
 * npm test
 * # or
 * npx ts-node framework_integration_test.ts
 * ```
 */

// Example 1: Basic TypeScript and type checking test
function greet(name?: string): string {
  if (!name) {
    return "Hello, World!";
  }
  return `Hello, ${name}!`;
}

function testGreet(): void {
  console.assert(greet() === "Hello, World!");
  console.assert(greet("Claude") === "Hello, Claude!");
}

// Example 2: Type checking with interfaces
interface User {
  id: number;
  name: string | null;
}

function testUserInterface(): void {
  const user: User = { id: 1, name: "Alice" };
  console.assert(user.id === 1);
  console.assert(user.name === "Alice");
}

// Run all tests when executed as script
if (require.main === module) {
  testGreet();
  testUserInterface();
  console.log("Basic TypeScript environment and type checking test passed.");
}
```

---

## Git Guidelines

### CRITICAL RULES - NEVER BREAK THESE:

• **NEVER** use `git add -A` or `git add .` - these are dangerous and can add unintended files
• **ALWAYS** add files explicitly by name: `git add specific_file.ts`
• **ALWAYS** check `git status` and `git diff --staged` before committing
• **NEVER** commit without reviewing exactly what is being staged

### Safe Git Workflow:
```bash
# Check what's changed
git status

# Add specific files only
git add src/specific_file.ts
git add src/another_file.ts

# Review what will be committed
git diff --staged

# Commit with descriptive message
git commit -m "feat: add specific feature with clear description"
```

## Final Notes

- Adapt tooling commands according to the specific project package manager.
- Prioritize readability and maintainability over micro-optimizations.
- Leverage TypeScript's type system for better code reliability.
- Use this guide to maintain consistency and quality across all your TypeScript projects.

## Common Development Practices

• Always run `npm run type-check` or `tsc --noEmit` before committing
• Use consistent formatting with Prettier
• Use ESLint for code quality checks

use context7
<ch:aliases>
ch   → Main helper: ch [category] [command]
chp  → Project overview (run first in new projects)
chs  → Search tools: find-code, find-file, search-imports
chg  → Git ops: quick-commit, pr-ready, diff

</ch:aliases>

<ch:categories>
project|p         → Project analysis
docker|d          → Container ops: ps, logs, shell, inspect
git|g             → Git workflows
search|s          → Code search (needs: ripgrep)
ts|node           → TypeScript/Node.js (needs: jq)
multi|m           → Multi-file ops (uses: bat)
env|e             → Environment checks
api               → API testing (needs: jq, httpie)
interactive|i     → Interactive tools (needs: fzf, gum)
context|ctx       → Context generation
code-relationships|cr → Dependency analysis
code-quality|cq   → Quality checks

</ch:categories>

<ch:key-commands>
# Start with project overview
chp

# Use helpers not raw commands
chs find-code "pattern"      # not grep
ch m read-many f1 f2 f3      # not multiple cats
chg quick-commit "msg"       # not git add && commit
ch i select-file             # interactive file picker
ch ctx for-task "desc"       # generate focused context
ch api test /endpoint        # test APIs

</ch:key-commands>

<ch:required-tools>
ripgrep → search-tools.sh
jq      → project-info.sh, ts-helper.sh, api-helper.sh
fzf     → interactive selections
bat     → syntax highlighting
gum     → interactive prompts
delta   → enhanced diffs

</ch:required-tools>

<ch:paths>
Scripts: ~/.claude/scripts/
Commands: ~/.claude/commands/

</ch:paths>

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Git Commit Guidelines

• never mention Claude in commits