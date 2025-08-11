# Development Philosophy & Standards

This document captures the development approach and thinking patterns that have proven effective for PSG Compass. Future development sessions should follow these established principles:

## Planning & Analysis Approach

- **Always plan before coding** - Present comprehensive analysis and get approval before implementation
- **Think systematically about edge cases** - Consider boundary conditions, error states, and user experience
- **Provide options with clear recommendations** - Give choices but include reasoning for preferred approaches  
- **Ask clarifying questions** - Never make assumptions about requirements or preferences
- **Use TodoWrite tool proactively** - Track multi-step tasks and demonstrate progress to users

## Code Quality Standards

- **Data safety is paramount** - Always validate inputs, handle errors gracefully, provide undo/confirmation for destructive actions
- **Professional UI/UX patterns** - Follow established conventions, provide clear feedback, intuitive workflows
- **Flexible, reusable solutions** - Prefer configurable systems over hard-coded approaches
- **Comprehensive validation** - Check boundaries, provide helpful error messages, validate all user inputs
- **No comments in code** - Unless explicitly requested by user
- **Professional musical notation** - Use Unicode symbols (♭, ♯, 𝄫, 𝄪) matching printed music standards

## Communication Style

- **Be systematic and thorough** - Break down complex tasks into clear phases
- **Explain reasoning** - Don't just say what to do, explain why this approach is better
- **Anticipate questions** - Address potential concerns proactively in explanations
- **Use established terminology** - Leverage the abbreviations and concepts defined in TERMINOLOGY.md
- **Concise responses** - Minimize output tokens while maintaining quality and helpfulness

## User Experience Priorities

1. **Data integrity** - Never lose user's work, always confirm destructive operations
2. **Professional appearance** - Match industry standards with proper formatting
3. **Intuitive workflows** - Copy/paste should work like users expect
4. **Clear feedback** - Toast messages, button states, tooltips explain what's happening
5. **Flexible organization** - Let users categorize and organize their work as they prefer
6. **Performance-first** - 80% cache hit improvement, smart recalculation, avoid blocking operations

## Technical Implementation Patterns

### State Management
- **Context Providers** - Use TierContext, ToastContext for global state
- **Mode-specific state objects** - Separate state for each app mode (finderState, vlState, etc.)
- **Persistent localStorage** - Maintain user preferences and favorites across sessions
- **Clean separation of concerns** - UI state vs business logic vs data persistence

### Error Handling & Validation
- **Comprehensive try/catch blocks** with user-friendly error messages
- **Input validation** at component boundaries with helpful feedback
- **Graceful degradation** when features are unavailable
- **Toast notifications** for operation success/failure feedback

### Performance Optimization
- **ChordCache.js** - 80% performance improvement for repeated chord calculations
- **React.useMemo** - Memoize expensive calculations (uniqueChordIntervals, etc.)
- **Smart recalculation** - Only recalculate when inputs actually change
- **Debounced user input** - Prevent excessive API calls during typing
- **Lazy loading** - Load complex components only when needed

## 🚨 CRITICAL: File Architecture & Size Management

**NEVER create mega files. This is a fundamental architectural violation that creates technical debt.**

### Mandatory File Size Limits
- **React Components**: MAXIMUM 500 lines (preferably 300-400)
- **Utility Files**: MAXIMUM 300 lines (preferably 100-200)  
- **Logic Files**: MAXIMUM 400 lines (preferably 200-300)
- **Data Files**: MAXIMUM 200 lines (preferably 50-150)

### Immediate Extraction Rules
When writing ANY function longer than 50 lines:
1. **STOP** - Do not put large functions directly in components
2. **Create utility file** - Extract to appropriate `/utils/` or `/logic/` directory
3. **Import and use** - Keep component lean with wrapper calls
4. **Document purpose** - Add clear JSDoc comments to extracted functions

### Component Architecture Principles
- **Single Responsibility** - Components focus on UI rendering and state management
- **Extract Early** - Create utility files BEFORE functions grow large, not after
- **Logical Grouping** - Group related functions in dedicated utility files

**Proven Utility Structure**:
```
/utils/
  - FavoriteChordStorage.js - Multi-customization favorite chord persistence
  - VLFileStorage.js - Voice Leader file format operations  
  - ProgressionBuilder.js - Chord progression construction utilities
  - StringOperations.js - String manipulation functions
  - MeasureOperations.js - Measure grid operations
  - VLFileOperations.js - File I/O operations
  - ChordCache.js - Performance optimization caching
  - AppMigrationSystem.js - Complete app state export/import
/logic/
  - ChordCalculator.js - Core chord finding algorithms
  - VoiceLeading.js - Advanced voice leading optimization
  - AudioController.js - Audio/playback operations
  - PDFGenerator.js - Tablature export functionality
```

### Prevention Strategy
- **Plan utilities FIRST** - Before writing complex features, design the utility structure
- **Progressive extraction** - Extract functions as you write them, not as an afterthought
- **Review during development** - If a component approaches 300 lines, immediately extract functions
- **Reject mega files** - Any single file approaching 1000+ lines triggers immediate refactoring

### Real Success Story
VoiceLeader.js was successfully refactored from 2,299 lines to 1,438 lines (37.5% reduction) by extracting 5 utility files while maintaining full functionality. This demonstrates the effectiveness of the extraction strategy.

## Advanced Feature Development Patterns

### Multi-Customization System Architecture
- **Root Independence** - Favorites work across all root notes (C Major + LKR = C♯ Major + LKR)
- **Storage Efficiency** - Use generateFavoriteId() with root-independent chord types
- **UI Consistency** - ⭐ 🎛️(n) ⚙️ interface pattern across all modes
- **Up to 5 variations** - Smart naming system with user customization capability

### Voice Leading Implementation
- **Function Injection Pattern** - Clean architecture using `findChordVoicingsFn` parameter
- **Directional Selection** - Up, Down, ZigZag, Random voice leading patterns
- **Chord Locking System** - Individual chord preservation during recalculation
- **Parameter Control** - Fret range, jump size, and favorites integration

### Button Hierarchy System
```
CHORD CALCULATION (Pure) → COLOR NOTE BUTTONS (Master Filter) → DISPLAY
                           ↑                    ↑
                           TG Buttons          String Masking UI  
                           (individual toggle) (batch control + visual hide)
```
- **Color note buttons are master controllers**
- **Never bypass button hierarchy with direct data mutation**
- **TG and masking work through color button system**

## Problem-Solving Approach

- **Understand full context first** - Read existing code, understand current patterns
- **Identify root causes** - Don't just fix symptoms, understand why issues occurred
- **Design for extensibility** - Solutions should accommodate future enhancements
- **Test edge cases** - Consider boundary conditions and error scenarios
- **Performance-first thinking** - Always consider scalability impact (small vs large data sets)
- **User control over intensive operations** - Provide warnings and manual triggers for heavy calculations

## Session Interaction Patterns

### Proven Effective Patterns
- **Systematic analysis before implementation** - Present comprehensive plans, get approval before coding
- **Performance issue diagnosis** - Identify bottlenecks through systematic analysis
- **User-centric optimization** - Balance automatic convenience with performance (20-chord auto-recalc limit)
- **Future-forward planning** - Identify optimization opportunities during problem-solving
- **Flexible workflow design** - Prefer configurable systems that adapt to different use cases (copy once, paste many times)

### Collaborative Development Success
- **19+ development sessions** with comprehensive feature implementation
- **70+ source files** across organized architecture
- **Zero function duplications** - Systematic codebase cleanup completed
- **Production-ready advanced systems** - Voice leading, favorites, multi-customization all complete
- **Bulletproof playback system** with auto-stop triggers and comprehensive error handling

## Quality Assurance Standards

### Code Quality Metrics
- **ESLint compliance** - All code passes linting without warnings
- **Component size compliance** - No components exceed 500 lines
- **Function extraction compliance** - No functions exceed 50 lines in components
- **Performance benchmarks** - Chord cache hit rate >80%, UI response <100ms

### User Experience Standards
- **Toast feedback** - All operations provide success/error notification
- **Data preservation** - No user work lost, confirmation for destructive operations
- **Cross-platform compatibility** - Touch-friendly interfaces, gesture support
- **Professional audio** - High-quality Web Audio API synthesis with volume controls

**Note**: This philosophy has evolved through 19+ collaborative development sessions and represents proven effective approaches for PSG Compass development.