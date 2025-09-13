# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lumen is a simple note-taking web application built with React and TypeScript. It enables users to capture and organize their thoughts with features like wikilinks, tags, templates, and GitHub synchronization.

## Development Commands

### Core Development

- `npm run dev` - Start development server with hot reload
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

## Development Notes

### Testing

- Uses Vitest for unit tests
- Storybook for component testing and documentation
- Test files should be co-located with source files using `.test.ts` suffix

### Code Style

- Prettier configuration: no semicolons, trailing commas, 100 character line length
- ESLint rules enforced for TypeScript, React, and accessibility

### Git Integration

- The app operates on a Git repository stored in the browser's filesystem
- Uses isomorphic-git for all Git operations
- Automatic synchronization with GitHub repositories

### Performance

- Bundle analysis available via `npm run build` (generates dist/stats.html)
- PWA configuration for offline functionality
- Lazy loading and code splitting implemented
