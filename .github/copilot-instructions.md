# Copilot Instructions

This file provides guidance to GitHub Copilot when working with code in this repository.

## Project Overview

Lumen is a simple note-taking web application built with React and TypeScript. It enables users to capture and organize their thoughts with features like wikilinks, tags, templates, and GitHub synchronization.

## Development Commands

### Core Development

- `npm run dev` - Start development server with hot reload (runs via Netlify Dev)
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run preview` - Preview production build locally

### Testing

- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode

### Code Quality

- `npm run lint` - Run ESLint on source files
- `npm run format` - Format code with Prettier

### Storybook

- `npm run dev:storybook` - Start Storybook development server
- `npm run build:storybook` - Build Storybook for production
- `npm run test:storybook` - Run Storybook tests
- `npm run test:storybook:watch` - Run Storybook tests in watch mode

### Other

- `npm run benchmark` - Run performance benchmarks
- `npm run dev:netlify` - Start development with Netlify functions

## Architecture

### State Management

- **Global State**: Uses XState state machines with Jotai for global state management (src/global-state.ts)
- **File System**: Integrates with isomorphic-git for Git operations and uses lightning-fs for browser file system
- **GitHub Integration**: Handles authentication, repository cloning, and synchronization

### Key Components

- **Note System**: Notes are parsed from markdown files with frontmatter support
- **Editor**: Built on CodeMirror 6 with custom extensions for wikilinks, frontmatter, and markdown features
- **Routing**: Uses TanStack Router for file-based routing
- **Templates**: Support for note templates with input variables
- **Voice Assistant**: OpenAI integration for voice conversations

### Data Flow

1. Markdown files are stored in a Git repository (GitHub integration)
2. Files are parsed into Note objects with extracted metadata (tags, links, dates)
3. Notes are indexed and made searchable using fast-fuzzy
4. UI components subscribe to state changes via Jotai atoms
5. Changes are automatically synced back to GitHub

### Core Technologies

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **Editor**: CodeMirror 6 with custom extensions
- **State**: XState + Jotai
- **Git**: isomorphic-git + lightning-fs
- **UI Components**: Radix UI primitives
- **Markdown**: Unified/remark ecosystem

### File Structure

- `src/components/` - React components with Storybook stories
- `src/routes/` - TanStack Router route definitions
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions and helpers
- `src/codemirror-extensions/` - Custom CodeMirror extensions
- `src/remark-plugins/` - Custom remark plugins for markdown processing
- `src/styles/` - CSS files and styling
- `netlify/edge-functions/` - Netlify edge functions for GitHub auth and proxying

## Coding Conventions

### TypeScript

- Use TypeScript for all new code
- Prefer explicit types over `any`
- Use type inference where appropriate
- Define interfaces for component props

### React

- Use functional components with hooks
- Prefer named exports over default exports
- Co-locate test files with source files using `.test.ts` or `.test.tsx` suffix
- Write Storybook stories for UI components

### Code Style

- **Prettier configuration**: 
  - No semicolons
  - Trailing commas
  - 100 character line length
- **ESLint**: Rules enforced for TypeScript, React, and accessibility
- Run `npm run format` before committing

### Component Patterns

- Use Radix UI primitives for accessible UI components
- Follow existing patterns for state management (XState + Jotai)
- Keep components small and focused
- Extract reusable logic into custom hooks

## Testing Guidelines

### Unit Tests

- Uses Vitest for unit tests
- Test files should be co-located with source files using `.test.ts` suffix
- Write tests for utility functions and custom hooks
- Mock external dependencies appropriately

### Component Tests

- Use Storybook for component testing and documentation
- Write stories for different component states and variations
- Use Storybook test runner for interaction testing

### Running Tests

- Run `npm test` to execute all tests once
- Use `npm run test:watch` during development for immediate feedback
- Run `npm run test:storybook` to test Storybook stories

## Git Integration Notes

- The app operates on a Git repository stored in the browser's filesystem
- Uses isomorphic-git for all Git operations
- Automatic synchronization with GitHub repositories
- Be cautious when modifying Git-related code as it affects core functionality

## Performance Considerations

- Bundle analysis available via `npm run build` (generates dist/stats.html)
- PWA configuration for offline functionality
- Lazy loading and code splitting implemented
- Be mindful of bundle size when adding new dependencies

## Editor Extensions

When working with CodeMirror extensions:
- Extensions are located in `src/codemirror-extensions/`
- Follow existing patterns for state management and view plugins
- Test extensions thoroughly in the editor context
- Consider performance implications for large documents

## Markdown Processing

When working with markdown:
- Custom remark plugins are in `src/remark-plugins/`
- Frontmatter is parsed using YAML
- Support for wikilinks, tags, and other custom syntax
- Use the unified/remark ecosystem for parsing and transformation

## Common Pitfalls

- Don't modify Git operations without understanding the full flow
- Test changes to markdown parsing with various input formats
- Ensure CodeMirror extensions handle edge cases
- Verify GitHub authentication changes work end-to-end
- Test state machine transitions thoroughly when modifying XState machines

## Getting Help

- Review existing code patterns before implementing new features
- Check Storybook for component examples and documentation
- Refer to the documentation of key libraries (React, XState, Jotai, CodeMirror)
- Look at test files for usage examples
