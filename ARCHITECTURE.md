# Architecture Overview

## Core Concept

PSG Compass helps pedal steel guitar players find chord voicings, analyze chord progressions, discover scales, and manage different "copedents" (string/pedal/lever configurations). It features a 2-tier system (Basic/Pro) that gates advanced features.

## Application Structure

### Main Application Modes
- **Chord Finder** (Basic tier): Find chord voicings across the fretboard
- **Scale Finder** (Basic tier): Discover scales and their fretboard patterns
- **Chord Decipher** (Pro tier): Identify chords from fret positions
- **Voice Leader** (Pro tier): Build and optimize chord progressions

### State Management Architecture

**Global State**: Uses React Context patterns:
- `TierContext` - User tier management (Basic/Pro)
- `ToastContext` - Toast notification system
- `App.js` - Central state coordinator with mode-specific state objects

**Mode-Specific State Objects**:
- `finderState` - Chord Finder mode state
- `decipherState` - Chord Decipher mode state  
- `scaleFinderState` - Scale Finder mode state
- `voiceLeaderState` - Voice Leader mode state with advanced features

### Component Architecture

**Core Components**:
- `App.js` - Main application shell, mode switching, state management
- `ChordFinder.js` - Chord search and discovery interface
- `ChordDecipher.js` - Fret position to chord identification
- `ScaleFinder.js` - Scale discovery and analysis
- `VoiceLeader.js` - Advanced chord progression builder
- `FretboardVisualizer.js` - Universal fretboard display component

**Supporting Components**:
- `CopedentEditor.js`/`CopedentManager.js` - Instrument configuration
- `RadialChordMenu.js` - Circular chord selection interface
- `MeasureGrid.js` - Musical measure and beat organization
- `ProgressionTablature.js` - Chord progression tablature display
- `VoiceLeadingAlternativesModal.js` - Advanced voice leading options

**Utility Components**:
- `StarToggleButton.js` - Favorite chord management
- `MultiCustomizationButton.js` - Multi-customization cycling
- `ExpandableManagementPanel.js` - Customization management UI
- `Toast.js` - Notification system

### Data Layer Architecture

**Static Data** (`/data/`):
- `DefaultCopedents.js` - Pre-configured pedal steel setups
- `DefaultChordTypes.js` - Comprehensive chord type definitions
- `DefaultProgressions.js` - Sample chord progressions
- `RadialWheelChordRoots.js` - Context-aware enharmonic chord spellings
- `Notes.js` - Musical note mappings and enharmonic equivalents
- `Scales.js` - Scale definitions and intervallic patterns

**Logic Layer** (`/logic/`):
- `ChordCalculator.js` - Core chord finding and voice leading algorithms
- `VoiceLeading.js` - Advanced voice leading optimization algorithms
- `AudioController.js` - Sound synthesis and playback management
- `PDFGenerator.js` - Tablature and chord chart export
- `SoundService.js` - Web Audio API integration
- `NoteUtils.js` - Musical note manipulation utilities

**Utility Layer** (`/utils/`):
- `FavoriteChordStorage.js` - Multi-customization favorite chord persistence
- `VLFileStorage.js` - Voice Leader file format operations
- `ChordCache.js` - Performance optimization caching
- `AppMigrationSystem.js` - Complete app state export/import
- `ProgressionBuilder.js` - Chord progression construction utilities
- `KeyTransposition.js` - Musical key and chord transposition

## Copedent System

The copedent system is central to the application architecture:

**Copedent Definition**:
- String tunings (open notes for each string)
- Pedal changes (pitch modifications when pedals are pressed)
- Knee lever changes (pitch modifications when levers are engaged)
- Splits (string-specific pedal/lever behaviors)
- Mechanisms (additional pitch control devices)

**Copedent Management**:
- Default copedents for common pedal steel configurations
- Custom copedent creation and editing
- Import/export functionality for sharing configurations
- Validation and error handling for invalid configurations

## Music Theory Engine

**Core Algorithms**:
- Chord voicing calculation across all fret positions
- Voice leading optimization using dynamic programming
- Scale pattern generation and analysis
- Enharmonic spelling based on musical context
- Interval filtering and chord customization

**Advanced Features**:
- Multi-customization favorite chord system (up to 5 variations per chord)
- Directional voice leading calculation (Up, Down, ZigZag, Random patterns)
- Individual chord locking system during recalculation
- Favorites integration with chord prioritization
- Professional audio system with metronome integration

## Data Flow Patterns

### Chord Finding Flow
1. User selects copedent, root note, and chord type
2. `ChordCalculator.js` processes requirements with selected copedent
3. Results cached in `ChordCache.js` for performance
4. `FretboardVisualizer.js` renders interactive tablature
5. User can favorite, customize, and export results

### Voice Leading Flow
1. User builds progression in `MeasureGrid.js`
2. User selects directional pattern in `VLDirectionalControls.js`
3. `ProgressionBuilder.js` converts to chord sequence with directional preferences
4. Chord calculation finds voicings based on direction and parameters
5. Results displayed in `ProgressionTablature.js` with locking capabilities
6. Export to PDF or VL file format

### Favorite Chord System Flow
1. User favorites chord in `FretboardVisualizer.js`
2. `FavoriteChordUtils.js` generates root-independent ID
3. `FavoriteChordStorage.js` manages localStorage persistence
4. Multi-customization system stores up to 5 variations
5. Cross-mode integration prioritizes favorites

## Platform Support

**Web Application**:
- React 18 with modern hooks and concurrent features
- Tailwind CSS for responsive, utility-first styling
- Web Audio API for high-quality sound synthesis
- LocalStorage for persistent user data

**Desktop Application**:
- Tauri for native desktop app packaging
- File system access for import/export operations
- Native OS integration for file dialogs
- Electron fallback support maintained

**Export Capabilities**:
- PDF generation using jsPDF and html2canvas
- VL file format for sharing progressions
- App migration files for complete state transfer
- Copedent files for instrument configuration sharing

## Performance Architecture

**Optimization Strategies**:
- Chord result caching (80% performance improvement)
- Memoized calculations for expensive operations
- Lazy loading of complex components
- Debounced user input processing

**Memory Management**:
- Cache invalidation on copedent changes
- Cleanup of audio resources
- Efficient state updates with minimal re-renders
- Smart component re-mounting strategies

## Development State

- **Version**: Pre-1.0 (actively developed)
- **Stability**: Production-ready core features
- **Backward Compatibility**: Not required (pre-release)
- **Testing**: Manual testing and user validation