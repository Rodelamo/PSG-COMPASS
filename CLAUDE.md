# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### React Development
- **Development server**: `npm start` - Runs at http://localhost:3000
- **Build for production**: `npm run build` - Creates optimized build in `build/` folder
- **Run tests**: `npm test` - Launches Jest test runner in watch mode

### Tauri Desktop App
- **Development with Tauri**: `npm run tauri:dev` - Runs React dev server + Tauri desktop app
- **Build Tauri app**: `npm run tauri:build` - Creates desktop app bundle
- **Tauri CLI**: `npm run tauri` - Access Tauri CLI commands

## Project Overview

**PSG Compass** - a comprehensive pedal steel guitar music application built with React and packaged as a desktop app using Tauri. The app can run both in browsers and as a native desktop application.

**Core Purpose**: Helps pedal steel guitar players find chord voicings, analyze chord progressions, discover scales, and manage different "copedents" (string/pedal/lever configurations). Features a tiered system (Basic/Intermediate/Advanced) that gates certain features.

## Essential Interaction Rules

### File Architecture Requirements
- **React Components**: MAXIMUM 500 lines (preferably 300-400)
- **Utility Files**: MAXIMUM 300 lines (preferably 100-200)  
- **Logic Files**: MAXIMUM 400 lines (preferably 200-300)
- **NEVER create mega files** - Extract functions to utilities BEFORE they grow large

### Development Standards
- **Always plan before coding** - Present analysis and get approval
- **Data safety is paramount** - Validate inputs, handle errors, confirm destructive actions
- **Use established terminology** - See [TERMINOLOGY.md](./TERMINOLOGY.md) for abbreviations
- **Follow existing patterns** - Check neighboring files for conventions

### Code Style
- **DO NOT ADD COMMENTS** unless explicitly asked
- **Professional UI/UX** - Match industry standards (Unicode symbols: ♭, ♯, 𝄫, 𝄪)
- **Performance-first** - Consider scalability impact, avoid unnecessary re-renders

## Current Development Status (Aug 10, 2025 - Session 19)

### Production Ready Systems ✅
- **Advanced Voice Leader System**: Intelligent collaborative workflow with auto-optimization
- **Radial Chord Menu**: Context-aware enharmonic spelling with "Key is King" implementation  
- **CP Enharmonic System**: Complete context-aware chord spelling consistency
- **Chord Finder**: Cached chord finding with 80% performance improvement
- **Use Favorites System**: Complete intelligent chord prioritization for Voice Leader
- **Button Hierarchy System**: Color note buttons as master controllers
- **Custom Category System**: Full CRUD operations with professional UI
- **Audio System**: High-quality playback with auto-stop triggers

### Current Development Focus
- **Multi-Customization Favorite System**: Up to 5 saved button state configurations per favorite chord
- **File System Enhancement**: Default VL progression files and complete app migration system

## Documentation Structure

**Core References:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture, copedent system, technical patterns
- [TERMINOLOGY.md](./TERMINOLOGY.md) - Standard abbreviations and conventions  
- [DEVELOPMENT_PHILOSOPHY.md](./DEVELOPMENT_PHILOSOPHY.md) - Coding standards, file size limits, best practices
- [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md) - Detailed feature implementations and technical specs

**Session Documentation:**
- [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md) - Complete session history with technical notes
- [COMPONENT_MAP.md](./COMPONENT_MAP.md) - Full file structure and component mapping
- [SESSION_NOTES.md](./SESSION_NOTES.md) - Current priorities and temporary notes

## Next Session Priorities

### Multi-Customization Favorite System (Phase 2A)
- **ExpandableManagementPanel.js**: Slide-down customization manager with radio button interface
- **MultiCustomizationButton.js**: Enhanced 🎛️(n) cycling component (0-5 customizations)
- **Enhanced FavoriteChordStorage.js**: Multi-customization CRUD operations
- **Cross-Platform UI**: Touch-friendly interface with gesture support

### Enhanced File System (Phase 2B)
- **Default VL Files**: Pre-built Voice Leader progression files with categories
- **Complete App Migration**: Full state export/import system for device transfers
- **Import/Export Enhancement**: Favorite collections with customization preservation

---

*Essential guidance for Claude Code development sessions. Detailed technical specifications and implementation notes are available in the linked documentation files.*