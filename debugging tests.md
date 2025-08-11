# PSG Compass - Comprehensive Testing Plan

## Overview
This document outlines a complete testing strategy for PSG Compass, a comprehensive pedal steel guitar music application, covering all features, edge cases, performance scenarios, and integration points.

## Testing Categories

### 1. 🎵 **Chord Finder System Testing**

#### **Basic Functionality Tests**
- [ ] **Chord Search**: Test all chord types (Major, Minor, Dominant 7, etc.) with all root notes (C through B, including sharps/flats)
- [ ] **Results Display**: Verify chord voicings display correctly with proper fret numbers, pedal combos, lever combos
- [ ] **Results Per Fret**: Test different result limits (1, 3, 5, 10) and verify correct number of results
- [ ] **Chord Naming**: Verify chord names display correctly with proper Unicode symbols (♯, ♭)
- [ ] **Fretboard Visualization**: Test chord diagrams render correctly with proper string positions

#### **Edge Cases & Error Conditions**
- [ ] **No Results Found**: Test chord types that may not exist on certain copedents
- [ ] **Invalid Copedent**: Test with corrupted or incomplete copedent data
- [ ] **Extreme Fret Positions**: Test chord generation at fret 0 and fret 24
- [ ] **Complex Chord Types**: Test extended chords (Add9, Sus2, 13th chords, etc.)
- [ ] **Enharmonic Equivalents**: Verify C# and D♭ produce contextually appropriate results
- [ ] **Memory Stress**: Generate 1000+ chord results and test performance
- [ ] **Rapid Searches**: Quickly change chord types/roots and verify no race conditions

#### **Chord Cache System**
- [ ] **Cache Population**: Verify repeated chord searches hit cache (check console logs)
- [ ] **Cache Statistics**: Test cache hit rates in development mode
- [ ] **Cache Invalidation**: Change copedents and verify cache clears appropriately
- [ ] **Cache Performance**: Compare first vs repeated chord generation times
- [ ] **Cache Memory**: Test cache doesn't grow indefinitely with varied searches

### 2. 🔍 **Chord Decipher System Testing**

#### **Basic Functionality Tests**
- [ ] **String Selection**: Test selecting 3, 4, 5+ strings in various combinations
- [ ] **Fret Input**: Test fret numbers 0-24, negative numbers, non-numeric input
- [ ] **Pedal Combinations**: Test single pedals, adjacent pedal combinations (P1+P2)
- [ ] **Lever Selection**: Test individual levers, multiple lever combinations
- [ ] **Mechanism Integration**: Test custom mechanisms if available
- [ ] **Chord Identification**: Verify common chords are identified correctly

#### **Edge Cases & Error Conditions**
- [ ] **Insufficient Strings**: Test with 0, 1, 2 strings selected
- [ ] **Invalid Combinations**: Test prohibited pedal/lever combinations
- [ ] **No Chord Match**: Test unusual note combinations that don't form standard chords
- [ ] **Enharmonic Results**: Verify chord results use appropriate note spelling for key context
- [ ] **String Order**: Test both high-to-low and low-to-high string ordering
- [ ] **Extreme Frets**: Test decipher at fret 0 and fret 24

#### **Validation System**
- [ ] **Pedal Conflicts**: Test mutually exclusive pedal combinations
- [ ] **Lever Physics**: Test physically impossible lever combinations
- [ ] **Error Messages**: Verify clear, helpful error messages for invalid inputs
- [ ] **Reset Functionality**: Test reset button clears all selections properly

### 3. 📏 **Scale Finder System Testing**

#### **Basic Functionality Tests**
- [ ] **Scale Generation**: Test all scale types (Major, Minor, Dorian, etc.) in all keys
- [ ] **Fretboard Display**: Verify scale patterns render correctly across fretboard
- [ ] **Scale Relationships**: Test related scales and chord connections
- [ ] **Scale Context**: Test scale suggestions from chord finder results

#### **Edge Cases & Error Conditions**
- [ ] **Scale Coverage**: Test scales that may not fit well on pedal steel tuning
- [ ] **Visual Clarity**: Test scale display with many notes (chromatic scale)
- [ ] **Performance**: Test scale generation speed for complex scales
- [ ] **Export Integration**: Test scale PDF export functionality

### 4. 🎼 **Voice Leader System Testing**

#### **Basic Functionality Tests**
- [ ] **Measure Grid**: Test chord entry, editing, deletion in measure slots
- [ ] **Chord Progression**: Create progressions with 2, 4, 8, 16+ chords
- [ ] **Directional Controls**: Test Up, Down, Zigzag, Random direction algorithms
- [ ] **Fret Range**: Test different fret ranges (0-12, 5-15, 0-24)
- [ ] **Results Per Fret**: Test different result limits affect voice leading quality

#### **Advanced Features Testing**
- [ ] **Auto-Optimization**: Test Viterbi algorithm with various progressions
- [ ] **Lock & Re-Roll**: Test locking individual chords and re-optimizing others  
- [ ] **Per-Chord Directions**: Test individual chord direction arrows (↗️ ↔️ ↘️)
- [ ] **Voice Leading Analytics**: Test quality scoring and improvement metrics
- [ ] **Alternatives Modal**: Test chord pool comparison and selection

#### **Use Favorites System**
- [ ] **Favorites Toggle**: Test "⭐ Use Favs" button functionality
- [ ] **Favorites Priority**: Verify favorite chords appear first in results
- [ ] **Fallback Behavior**: Test when no favorites available for chord type
- [ ] **Integration**: Test favorites work with optimization and locking

#### **String Masking System**
- [ ] **Global Masking**: Test masking individual strings (1-10)
- [ ] **Visual Hiding**: Verify masked strings hide from tablature display
- [ ] **Audio Integration**: Test masked strings don't play in audio
- [ ] **PDF Export**: Verify masking preserved in exported PDFs
- [ ] **Button Interactions**: Test masking disables color note buttons correctly

#### **File Management**
- [ ] **VL File Save**: Test saving progressions with metadata
- [ ] **VL File Load**: Test loading saved progressions
- [ ] **Categories**: Test custom categories and organization
- [ ] **File Validation**: Test loading corrupted or invalid VL files

#### **Edge Cases & Stress Tests**
- [ ] **Large Progressions**: Test 50+ chord progressions
- [ ] **Complex Voice Leading**: Test progressions with difficult voice leading
- [ ] **Performance Warnings**: Test >100 chord progression warning system
- [ ] **Memory Usage**: Monitor memory with very long progressions
- [ ] **Auto-Stop System**: Test playback stops when switching modes/operations

### 5. ⭐ **Favorite Chord System Testing**

#### **Basic Functionality Tests**
- [ ] **Star Toggle**: Test favoriting/unfavoriting chords in CF, CD, VL modes
- [ ] **Visual Indicators**: Verify star icons (⭐) and light blue backgrounds
- [ ] **Root Independence**: Test C Major favorite shows for C#, D, E♭, etc.
- [ ] **Cross-Mode Consistency**: Verify favorites work identically across all modes
- [ ] **Persistence**: Test favorites survive browser restart

#### **Storage & Performance**
- [ ] **localStorage Integration**: Test favorites save/load correctly
- [ ] **Large Collections**: Test performance with 100+ favorite chords
- [ ] **Copedent Association**: Test favorites tied to correct copedents
- [ ] **Deletion Confirmation**: Test favorite removal confirmation dialog

#### **Edge Cases**
- [ ] **Duplicate Prevention**: Test can't favorite same chord twice
- [ ] **Invalid Data**: Test loading corrupted favorite data
- [ ] **Storage Limits**: Test localStorage quota limits with massive favorites
- [ ] **Cross-Browser**: Test favorites work in different browsers

### 6. 💾 **App Migration System Testing**

#### **Export Functionality**
- [ ] **Complete Export**: Test exporting all app data types
- [ ] **Export Summary**: Verify accurate item counts in export preview
- [ ] **File Generation**: Test migration file downloads correctly
- [ ] **File Size**: Test export file size reasonable (not corrupted)
- [ ] **JSON Validation**: Verify exported JSON is valid and properly formatted

#### **Import Functionality**
- [ ] **File Upload**: Test drag & drop and file picker upload methods
- [ ] **File Validation**: Test validation catches invalid/corrupted files
- [ ] **Import Summary**: Verify preview shows correct data counts
- [ ] **Import Process**: Test complete import restores all data correctly
- [ ] **Page Refresh**: Test page refreshes after import to show new data

#### **Data Integrity Tests**
- [ ] **Complete Round-Trip**: Export → Import on fresh app, verify identical state
- [ ] **Partial Data**: Test import with only some data types
- [ ] **Relationship Preservation**: Verify copedent-favorite relationships maintained
- [ ] **Conflict Resolution**: Test duplicate name/ID handling
- [ ] **Backup System**: Test backup creation and restoration on import failure

#### **Edge Cases & Stress Tests**
- [ ] **Large Files**: Test migration with 1000+ favorites, 50+ copedents
- [ ] **File Corruption**: Test various corrupted JSON scenarios
- [ ] **Version Compatibility**: Test files from "future" app versions
- [ ] **Empty Data**: Test export/import with no user data
- [ ] **Browser Limits**: Test large file handling in different browsers
- [ ] **Network Issues**: Test import behavior with slow/interrupted uploads

### 7. 🎛️ **Copedent Editor System Testing**

#### **Basic Functionality Tests**
- [ ] **String Configuration**: Test adding, removing, reordering strings
- [ ] **Pedal Setup**: Test pedal creation, semitone changes, string assignments
- [ ] **Lever Configuration**: Test knee lever setup and combinations
- [ ] **Mechanism System**: Test custom mechanisms if implemented
- [ ] **Copedent Save**: Test saving custom copedents with validation

#### **Validation & Error Handling**
- [ ] **Required Fields**: Test validation for name, string count, etc.
- [ ] **Duplicate Names**: Test duplicate copedent name handling
- [ ] **Invalid Tunings**: Test invalid note names, octave numbers
- [ ] **Impossible Changes**: Test physically impossible pedal/lever combinations
- [ ] **Split System**: Test string splits and complex pedal interactions

#### **Import/Export Integration**
- [ ] **Copedent Export**: Test individual copedent export
- [ ] **Copedent Import**: Test importing copedent files
- [ ] **Cross-Platform**: Test copedent files work on different systems

### 8. 🔊 **Audio System Testing**

#### **Basic Playback Tests**
- [ ] **Single Chord Play**: Test pluck button playback for individual chords
- [ ] **Block Chord Play**: Test full chord simultaneous playback
- [ ] **Volume Scaling**: Test volume scales appropriately with string count
- [ ] **Playback Duration**: Test standard 1.5-2s playback duration
- [ ] **Multiple Instances**: Test overlapping audio doesn't cause issues

#### **Auto-Stop System**
- [ ] **Mode Switching**: Test audio stops when switching between CF/CD/VL/SF
- [ ] **Chord Changes**: Test audio stops when generating new chords
- [ ] **Manual Stop**: Test stop buttons work immediately
- [ ] **Tab Changes**: Test audio stops when switching browser tabs
- [ ] **Error Recovery**: Test audio system recovers from Web Audio errors

#### **Voice Leader Audio**
- [ ] **Progression Playback**: Test sequential chord progression playback
- [ ] **Tempo Control**: Test different tempo settings
- [ ] **Metronome**: Test metronome integration if implemented
- [ ] **String Masking Audio**: Test masked strings don't play sound

#### **Edge Cases**
- [ ] **Rapid Clicking**: Test rapid play button clicking doesn't break audio
- [ ] **Browser Compatibility**: Test Web Audio API works across browsers
- [ ] **Mobile Devices**: Test audio works on iOS/Android
- [ ] **Headphones/Speakers**: Test audio output routing

### 9. 📄 **PDF Export System Testing**

#### **Basic Export Tests**
- [ ] **Single Chord PDF**: Test individual chord diagram export
- [ ] **Multi-Chord PDF**: Test export list with multiple chords
- [ ] **VL Progression PDF**: Test voice leading progression export
- [ ] **Scale PDF**: Test scale pattern PDF generation

#### **Formatting & Quality**
- [ ] **Chord Diagrams**: Verify fretboard diagrams render correctly
- [ ] **Text Clarity**: Test chord names, pedal/lever labels legible
- [ ] **Page Layout**: Test multiple chords fit properly on pages
- [ ] **String Masking**: Test masked strings hidden in PDF output
- [ ] **Color Coding**: Test color note buttons preserved in PDF

#### **Edge Cases**
- [ ] **Large Exports**: Test PDFs with 50+ chords
- [ ] **Complex Names**: Test chord names with Unicode symbols in PDF
- [ ] **Print Quality**: Test PDF print output matches screen
- [ ] **File Size**: Test PDF file sizes reasonable for content

### 10. 🎡 **Radial Chord Menu Testing**

#### **Wheel Mechanics**
- [ ] **Circle Rotation**: Test outer/middle/inner circle positioning
- [ ] **Key Changes**: Test wheel rotation for all 24 major/minor keys
- [ ] **Highlighting**: Test I-vi-vii° highlighting pattern
- [ ] **"Key is King"**: Verify C major and A minor have identical wheel states

#### **Enharmonic System**
- [ ] **Context-Aware Spelling**: Test flat keys use flats, sharp keys use sharps
- [ ] **Chord Selection**: Test selected chords use proper enharmonic spelling
- [ ] **Twin Keys**: Test relative major/minor pairs produce identical results

### 11. 🏗️ **Integration & System Tests**

#### **Cross-Mode Integration**
- [ ] **Mode Switching**: Test smooth transitions between CF/CD/VL/SF modes
- [ ] **Data Persistence**: Test mode switches preserve current work
- [ ] **Shared State**: Test copedent changes affect all modes
- [ ] **Audio Cleanup**: Test mode switches stop all audio properly

#### **Copedent Integration**
- [ ] **Default Copedents**: Test all default copedents load and work correctly
- [ ] **Custom Copedents**: Test custom copedents work across all features
- [ ] **Copedent Switching**: Test switching copedents updates all features
- [ ] **Error Recovery**: Test invalid copedents don't break the app

#### **Performance Integration**
- [ ] **Memory Usage**: Monitor memory usage during extended sessions
- [ ] **Cache Coordination**: Test caches don't interfere with each other
- [ ] **Large Data Sets**: Test app performance with extensive user data
- [ ] **Background Processing**: Test async operations don't block UI

### 12. 📱 **UI/UX & Responsiveness Testing**

#### **Desktop Testing**
- [ ] **Screen Sizes**: Test 1920x1080, 1366x768, 2560x1440 resolutions
- [ ] **Browser Compatibility**: Test Chrome, Firefox, Safari, Edge
- [ ] **Zoom Levels**: Test 50%, 75%, 100%, 125%, 150% zoom
- [ ] **Keyboard Navigation**: Test tab order and keyboard shortcuts

#### **Mobile & Tablet Testing**
- [ ] **Touch Interactions**: Test all buttons work with touch
- [ ] **Screen Orientation**: Test portrait and landscape modes
- [ ] **Mobile Safari**: Test iOS Safari compatibility
- [ ] **Android Chrome**: Test Android Chrome compatibility
- [ ] **Tablet Layouts**: Test iPad and Android tablet layouts

#### **Accessibility**
- [ ] **Screen Reader**: Test with screen reader software
- [ ] **High Contrast**: Test high contrast mode compatibility
- [ ] **Color Blindness**: Test color coding works for color blind users
- [ ] **Keyboard Only**: Test full app functionality without mouse

### 13. 💾 **Data Persistence & Storage Testing**

#### **localStorage Testing**
- [ ] **Storage Limits**: Test localStorage quota limits
- [ ] **Data Corruption**: Test recovery from corrupted localStorage
- [ ] **Cross-Tab Sync**: Test data consistency across multiple tabs
- [ ] **Private/Incognito**: Test behavior in private browsing modes

#### **File System Integration**
- [ ] **File Downloads**: Test all export downloads work correctly
- [ ] **File Uploads**: Test all import file selections work
- [ ] **Large Files**: Test handling of large migration files
- [ ] **File Permissions**: Test file system access permissions

### 14. ⚡ **Performance & Load Testing**

#### **Response Time Tests**
- [ ] **Chord Generation**: Target <200ms for basic chord generation
- [ ] **Search Response**: Target <100ms for search interface updates
- [ ] **Mode Switching**: Target <300ms for mode transitions
- [ ] **Audio Playback**: Target <100ms from click to audio start

#### **Memory Usage Tests**
- [ ] **Memory Leaks**: Monitor memory usage over extended sessions
- [ ] **Garbage Collection**: Test memory cleanup after operations
- [ ] **Large Datasets**: Test performance with extensive favorites/files
- [ ] **Cache Management**: Test caches don't consume excessive memory

#### **Stress Testing**
- [ ] **Rapid Operations**: Test rapid clicking, searching, mode switching
- [ ] **Concurrent Actions**: Test multiple simultaneous operations
- [ ] **Extended Sessions**: Test 4+ hour continuous usage
- [ ] **Data Limits**: Test with maximum possible user data

### 15. 🔒 **Security & Error Handling**

#### **Input Validation**
- [ ] **XSS Prevention**: Test script injection in text inputs
- [ ] **JSON Parsing**: Test malformed JSON handling in imports
- [ ] **File Validation**: Test malicious file upload attempts
- [ ] **URL Parameters**: Test URL manipulation attempts

#### **Error Recovery**
- [ ] **Network Errors**: Test behavior during network issues
- [ ] **Storage Errors**: Test localStorage/quota error handling
- [ ] **Audio Errors**: Test Web Audio API error recovery
- [ ] **JavaScript Errors**: Test error boundaries and graceful degradation

---

## 🧪 **What Claude Can Help With**

### **Automated Tests I Can Run:**

#### **Static Code Analysis**
- ✅ **Build Validation**: Run `npm run build` to check for compilation errors
- ✅ **ESLint Analysis**: Identify code quality issues, unused variables, potential bugs
- ✅ **Import/Export Validation**: Check all imports resolve correctly
- ✅ **File Structure Analysis**: Verify all referenced files exist

#### **Logic & Algorithm Testing**
- ✅ **Function Analysis**: Review function logic for edge cases and potential issues
- ✅ **Data Flow Analysis**: Trace data flow through complex operations
- ✅ **State Management Review**: Check for potential race conditions or state issues
- ✅ **Performance Code Review**: Identify performance bottlenecks in algorithms

#### **File System Tests**
- ✅ **File Reading**: Read and validate all project files
- ✅ **Content Analysis**: Check file contents for potential issues
- ✅ **Structure Validation**: Verify project structure and organization

#### **Integration Analysis**
- ✅ **Component Integration**: Analyze how components interact
- ✅ **API Compatibility**: Check function signatures and interfaces
- ✅ **Data Format Validation**: Verify data structures match expectations

### **Testing Support I Can Provide:**

#### **Test Case Generation**
- Generate specific test scenarios based on your findings
- Create edge case test data and inputs
- Design stress test scenarios
- Suggest testing workflows and priorities

#### **Bug Analysis**
- Analyze error messages and stack traces
- Review code to identify root causes
- Suggest fixes and improvements
- Help debug complex issues

#### **Code Review & Optimization**
- Review code changes and fixes
- Identify potential performance improvements
- Suggest refactoring opportunities
- Validate architectural decisions

#### **Documentation & Planning**
- Update documentation based on test results
- Plan feature improvements and bug fixes
- Create development priorities
- Document testing findings and resolutions

---

## 🎯 **Recommended Testing Approach**

### **Phase 1: Core Functionality (Priority 1)**
1. **Chord Finder Basic Tests** - Verify core chord generation works
2. **Audio System Tests** - Ensure playback functions properly
3. **Navigation Tests** - Verify mode switching and basic UI
4. **Build & Performance** - Confirm app builds and runs efficiently

### **Phase 2: Advanced Features (Priority 2)**
1. **Voice Leader System** - Test complex voice leading algorithms
2. **Favorite System** - Verify favorites work across all modes
3. **Migration System** - Test export/import functionality thoroughly
4. **Copedent Editor** - Validate custom copedent creation

### **Phase 3: Edge Cases & Integration (Priority 3)**
1. **Error Handling** - Test all error conditions and edge cases
2. **Cross-Browser Testing** - Verify compatibility across platforms
3. **Performance Stress Tests** - Test with large datasets and extended usage
4. **Mobile & Accessibility** - Ensure responsive design and accessibility

### **Phase 4: User Experience (Priority 4)**
1. **UI/UX Polish** - Test complete user workflows end-to-end
2. **Documentation** - Verify help text and user guidance
3. **Final Integration** - Test complete feature interactions
4. **Production Readiness** - Final validation for release

---

**Let's start testing! Tell me which area you'd like to focus on first, and I'll run the appropriate automated tests and provide detailed analysis.**