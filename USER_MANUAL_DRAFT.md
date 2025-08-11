# PSG Compass - User Manual Draft

**Version**: Pre-1.0 (August 2025)  
**Platform**: Web & Desktop (Tauri/Electron)  
**Target Users**: Pedal Steel Guitar Players

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Application Overview](#application-overview)
3. [Tier System](#tier-system)
4. [Chord Finder Mode (CF)](#chord-finder-mode-cf)
5. [Scale Finder Mode (SF)](#scale-finder-mode-sf)
6. [Chord Decipher Mode (CD)](#chord-decipher-mode-cd)
7. [Voice Leader Mode (VL)](#voice-leader-mode-vl)
8. [Favorite Chord System](#favorite-chord-system)
9. [Copedent Management](#copedent-management)
10. [Export & File Management](#export--file-management)
11. [Audio System](#audio-system)
12. [Settings & Preferences](#settings--preferences)
13. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Launch
1. **Select User Tier**: Choose between Basic (free) or Pro (paid) tier
2. **Choose Copedent**: Select your pedal steel configuration from default options
3. **Explore Chord Finder**: Start with the basic chord discovery mode

### Navigation
- **Mode Buttons**: Click the top navigation to switch between modes
- **Copedent Selector**: Change your instrument configuration at any time
- **Help Tooltips**: Hover over buttons for explanations

---

## Application Overview

### Main Interface Elements
- **Mode Navigation**: Chord Finder | Scale Finder | Chord Decipher | Voice Leader
- **Copedent Selector**: Dropdown to choose instrument configuration
- **Settings Button**: Access app settings and tier management
- **Export Button**: Access PDF export and file management options

### Color Coding System
- **Green Buttons**: Played chord tones (click to mute)
- **Yellow Buttons**: Unison strings (click to mute)
- **Grey Buttons**: Muted/off notes (click to restore)
- **Red Buttons**: Unavailable notes (cannot be changed)
- **Light Blue Background**: Favorited chord voicings

---

## Tier System

### Basic Tier (Free)
**Includes:**
- ✅ Chord Finder - Complete chord discovery
- ✅ Scale Finder - Scale analysis and visualization
- ✅ Full copedent management and customization
- ✅ Favorite chord system with multi-customization
- ✅ PDF export functionality
- ✅ Audio playback with volume controls

### Pro Tier (Paid)
**Adds:**
- ✅ Chord Decipher - Identify chords from fret positions
- ✅ Voice Leader - Advanced chord progression builder
- ✅ Voice leading optimization with AI assistance
- ✅ VL file management and progression organization
- ✅ Advanced audio features and metronome

### Upgrading
- Click the settings button and select "Upgrade to Pro"
- Features are instantly unlocked upon tier change

---

## Chord Finder Mode (CF)

### Primary Interface

#### Chord Selection
- **Root Note Dropdown**: Select chord root (C, C♯, D♭, etc.)
- **Chord Type Selection**: Click "Select Chord" to open chord library
- **♯/♭ Toggle**: Switch between sharp and flat note displays

#### Search Controls
- **Results Per Fret**: Choose how many voicings to show per fret position
- **Interval Filtering**: Click "Filter Intervals" to customize which chord tones to include
- **Search Button**: Click "Find Chords" to calculate voicings

### Results Display

#### Fretboard Visualization
Each chord result shows:
- **Fret Position**: Number at the top indicating starting fret
- **String Layout**: Interactive buttons for each string
- **Control Indicators**: Pedals (P1, P2, etc.) and levers (LKL, RKL, etc.) required
- **Play Buttons**: Arpeggio (↗) and block chord (▢) playback

#### Result Actions
- **⭐ Favorite**: Star button to save chord as favorite
- **🎛️(n) Customization**: Cycle through saved customizations (0-5)
- **⚙️ Management**: Open customization management panel
- **Export Checkbox**: Select for PDF export

### Favorite System Integration

#### Starring Chords
1. Click the ⭐ button on any chord result
2. Chord background turns light blue
3. Favorites work across all root notes (root independence)

#### Multi-Customization System
1. **Default State (0)**: Original calculated chord
2. **Modify Chord**: Click green/yellow buttons to mute strings (turn grey)
3. **Save Customization**: Click ⚙️ → "Save Current As..." → Enter name
4. **Cycle Through**: Use 🎛️(n) button to switch between saved customizations
5. **Manage**: Click ⚙️ to delete, rename, or organize customizations

### Chord Library
- **Categories**: Major, Minor, Dominant, Diminished, etc.
- **Extended Chords**: 7ths, 9ths, 11ths, 13ths, alterations
- **Search Function**: Type to find specific chord types
- **Recent Chords**: Quick access to recently used types

### Advanced Features
- **Cache System**: Previously found chords load instantly (80% speed improvement)
- **Impossible Chord Detection**: Helpful suggestions when chord isn't possible
- **Scale Analysis**: Click "Find Scales" to see related scales for any chord

---

## Scale Finder Mode (SF)

### Scale Selection Interface
- **Root Note**: Choose scale starting note
- **Scale Type**: Select from extensive scale library (Major, Minor, Modal, etc.)
- **♯/♭ Toggle**: Switch between sharp and flat displays

### Fretboard Analysis
- **Color-Coded Dots**: Each scale degree shown in different color
- **Pedal/Lever Integration**: Use controls to access different scale positions
- **Pattern Recognition**: Visual patterns help identify scale shapes

### Context Integration
- **Chord Context**: Analyze scales in relation to chord progressions
- **Modal Relationships**: See how scales relate to their modal variants
- **Export Options**: Save scale patterns to PDF

---

## Chord Decipher Mode (CD)

### Input Interface
- **Fret Selection**: Choose starting fret position
- **String Selection**: Click strings to include in analysis
- **Pedal/Lever Controls**: Select active pedals and levers
- **String Order Toggle**: Switch between high-to-low and low-to-high display

### Analysis Results
- **Chord Identification**: Shows possible chord matches
- **Quality Scoring**: Indicates confidence level of matches
- **Alternative Interpretations**: Multiple chord possibilities when applicable

### Integration Features
- **Favorite Integration**: Star discovered chords for future use
- **Export Options**: Save deciphered chords to PDF
- **Context Analysis**: See related scales and progressions

---

## Voice Leader Mode (VL)

### Measure Grid Interface

#### Building Progressions
- **Measure Slots**: Click any beat position to add chord
- **Chord Selection**: Use Radial Chord Menu or Extended Chord Menu
- **Display Modes**: Switch between chord names, Roman numerals, Nashville numbers
- **Key Center**: Set tonal center for proper chord analysis

#### Radial Chord Menu
- **Three Circles**: Outer (Major), Middle (Minor), Inner (Diminished)
- **Clock Positions**: 12 positions around each circle
- **Context-Aware Spelling**: Chords spelled correctly for selected key
- **"Key is King"**: F major and D minor use identical wheel layout

#### Extended Chord Menu
- **Comprehensive Library**: All chord types with professional categorization
- **Search Function**: Find specific chord types quickly
- **Recent/Favorites**: Quick access to commonly used chords

### Voice Leading Controls System

#### Chord Calculation with Directional Selection
1. **Build Progression**: Add chords to measure grid using radial chord menu
2. **Select Direction**: Choose movement pattern from Voice Leading Controls
3. **Calculate Voicings**: System finds chord voicings based on directional preference
4. **Review Results**: See chord voicings in resulting tablature

#### Directional Selection Options
- **Up (⬆)**: Move up in frets with looping
- **Down (⬇)**: Move down in frets with looping  
- **Up-Down (↗↘)**: Zig-zag pattern starting upward
- **Down-Up (↘↗)**: Zig-zag pattern starting downward
- **Random (🎲)**: Random fret selection for variety

#### Control Parameters
- **Start Fret**: Set starting fret position (0-24)
- **Fret Range**: Define min/max fret range using dual slider
- **Jump Size**: Control interval between chord positions (0-11)
- **Results Per Fret**: Number of chord voicings to show per fret position

### Chord Locking System
- **Lock Icons**: Click lock icons on individual chord results to preserve them
- **Lock Status**: 🔒 indicates locked chord, 🔓 indicates unlocked
- **Preservation**: Locked chords remain unchanged during recalculation
- **Toast Feedback**: System confirms lock/unlock actions

### Favorites Integration
- **⭐ Use Favs Toggle**: Enable to prioritize favorite chord voicings in Voice Leading Controls
- **Smart Prioritization**: Favorites returned first, regular voicings as fallback
- **Cross-Mode Compatibility**: Same favorites work across CF, CD, and VL modes

### Audio System
- **Metronome**: Professional click track with tempo control (40-500 BPM)
- **Volume Control**: Adjustable metronome click volume
- **Progression Playback**: Play entire progression with metronome timing
- **Individual Chord Preview**: Click play buttons on chord results to hear them
- **Auto-Stop**: Audio automatically stops when switching modes or closing dialogs

### File Management

#### VL Files (.vlf)
- **Save Progressions**: Store voicings, settings, and optimizations
- **Category Organization**: Organize by genre, style, or custom categories
- **Import/Export**: Share progressions with other users
- **Version History**: Track changes and iterations

#### Category Management
- **Custom Categories**: Create, rename, delete progression categories
- **Default Categories**: Common styles (Jazz, Country, Pop, etc.)
- **Bulk Operations**: Move multiple progressions between categories
- **Search and Filter**: Find progressions quickly

---

## Favorite Chord System

### Universal Favorite Interface
The favorite system works consistently across all modes with the **⭐ 🎛️(n) ⚙️** interface pattern.

### Star Button (⭐)
- **Click to Favorite**: Toggle favorite status on/off
- **Visual Feedback**: Favorited chords show light blue background
- **Root Independence**: Same chord+control combination works across all root notes
- **Cross-Mode Sync**: Favorites work in CF, CD, and VL modes

### Multi-Customization Button (🎛️)
- **Cycle Through States**: Click to cycle through customizations 0→1→2→3→4→5→0
- **State Indicator**: Shows current customization number (0=default)
- **Instant Application**: Customization applies immediately
- **Touch-Friendly**: 44px minimum touch target for mobile compatibility

### Management Panel (⚙️)
- **Radio Button Selection**: Choose active customization (0-5)
- **Save Current As...**: Save current button states as new customization
- **Delete Customization**: Remove unwanted customizations
- **Rename**: Edit customization names for clarity

### Creating Customizations

#### Basic Workflow
1. **Find Chord**: Use any mode to find desired chord
2. **Star It**: Click ⭐ to favorite
3. **Modify Buttons**: Click green/yellow buttons to mute strings (turn grey)
4. **Save Customization**: Click ⚙️ → "Save Current As..." → Enter descriptive name
5. **Access Later**: Use 🎛️(n) to cycle between default and saved customizations

#### Smart Naming
The app auto-generates descriptive names:
- "3 strings muted" - When strings are selectively muted
- "Bass only" - When only low strings are active
- "Minimal voicing" - When heavily reduced
- **User Override**: Edit these names for personal preference

#### Cross-Mode Benefits
- **Voice Leader Priority**: Enable "⭐ Use Favs" to prioritize favorites in progressions
- **Consistent UI**: Same interface works across all modes
- **Performance**: Favorites load faster due to caching

---

## Copedent Management

### Default Copedents
- **E9 Copedent**: Standard 10-string pedal steel configuration
- **Universal Copedent**: Modern 12-string setup
- **C6 Copedent**: Traditional lap steel configuration
- **Custom Variants**: Modified versions of standard setups

### Copedent Editor

#### Page 1 - Basic Configuration
- **String Tuning**: Set open tuning for each string
- **Pedal Changes**: Configure pitch changes for each pedal (A, B, C, etc.)
- **Knee Lever Changes**: Set up knee lever modifications (LKL, RKL, LKR, etc.)
- **Validation**: Real-time checking for conflicts and errors

#### Page 2 - Advanced Features
- **Splits Configuration**: String-specific pedal/lever behaviors
- **Custom Mechanisms**: Add non-standard controls (palm pedals, etc.)
- **Resulting Note Display**: See actual notes after semitone changes
- **Include/Exclude/Define**: Control how mechanisms affect calculations

### Custom Copedent Creation
1. **Start from Template**: Choose closest default copedent
2. **Modify Settings**: Adjust tuning, pedals, levers as needed
3. **Name and Save**: Give descriptive name and save to library
4. **Test and Refine**: Use in chord finding to verify functionality

### Import/Export
- **Share Copedents**: Export custom configurations as .cop files
- **Import Others**: Load copedents from other users
- **Backup**: Export all copedents for safekeeping
- **Migration**: Include in app migration files

---

## Export & File Management

### PDF Export

#### Chord Finder PDFs
- **Select Chords**: Check export checkbox on desired chords
- **Batch Export**: Export multiple chords to single PDF
- **Professional Layout**: Clean, printable tablature format
- **Include Metadata**: Chord names, copedent info, date generated

#### Scale Finder PDFs
- **Scale Patterns**: Export fretboard scale diagrams
- **Multiple Keys**: Include several keys on one page
- **Color Legend**: Explanation of scale degree colors
- **Practice Sheets**: Formatted for easy reading during practice

#### Voice Leader PDFs
- **Complete Progressions**: Full chord progressions with voicings
- **Quality Metrics**: Include transition costs and optimization notes
- **Multiple Formats**: Lead sheets, tablature, or combination
- **String Masking**: Respect string visibility settings

### File System

#### VL Files (.vlf)
- **Complete State**: Saves progression, voicings, settings, optimization history
- **Category Information**: Maintains organization structure
- **Version Compatibility**: Forward/backward compatible format
- **Metadata**: Creation date, copedent used, quality metrics

#### App Migration Files (.amf)
- **Complete Backup**: All user data in single file
- **Device Transfer**: Move entire app state to new device
- **Selective Restore**: Choose what to import
- **Data Validation**: Integrity checking on import

### Cloud Sync (Future)
- Account-based synchronization across devices
- Automatic backup of user data
- Collaborative sharing of progressions and copedents

---

## Audio System

### Sound Quality
- **Web Audio API**: Professional-grade synthesis engine
- **High-Quality Samples**: Realistic pedal steel guitar tones
- **Volume Control**: Separate levels for chords and metronome
- **Low Latency**: Responsive playback for real-time use

### Playback Modes

#### Chord Playback
- **Arpeggio (↗)**: Notes played in sequence, low to high
- **Block Chord (▢)**: All notes played simultaneously
- **Duration Control**: Adjustable note lengths
- **Velocity**: Volume variation based on string position

#### Progression Playback
- **Metronome Integration**: Play with click track
- **Tempo Control**: 40-500 BPM range
- **Time Signature**: 4/4, 3/4, 2/4, and more
- **Loop Playback**: Repeat progressions for practice

### Auto-Stop System
Audio automatically stops when:
- Switching between application modes
- Closing modals or dialogs
- Navigating away from the page
- Encountering audio errors

### Error Handling
- **Graceful Degradation**: App works without audio if unavailable
- **User Feedback**: Clear messages when audio fails
- **Recovery**: Automatic retry after temporary failures

---

## Settings & Preferences

### User Preferences
- **Default String Order**: High-to-low vs low-to-high
- **Enharmonic Preference**: Sharps vs flats as default
- **Audio Volume**: Persistent volume settings
- **UI Theme**: Light/dark mode preferences (future)

### Performance Settings
- **Cache Management**: Clear chord calculation cache
- **Memory Usage**: Monitor and optimize resource usage
- **Update Preferences**: Automatic vs manual updates

### Data Management
- **Export All Data**: Complete app state backup
- **Import Data**: Restore from backup files
- **Reset App**: Clear all user data (with confirmation)
- **Storage Usage**: Monitor localStorage consumption

---

## Troubleshooting

### Common Issues

#### Audio Not Working
- **Check Browser Permissions**: Some browsers block autoplay
- **Enable Web Audio**: Ensure browser supports Web Audio API
- **Volume Settings**: Check both app and system volume
- **Try Different Browser**: Chrome/Edge generally work best

#### Slow Performance
- **Clear Cache**: Use settings to clear chord calculation cache
- **Reduce Complexity**: Lower "Results Per Fret" setting
- **Close Other Tabs**: Free up browser memory
- **Restart App**: Refresh page to clear memory leaks

#### Missing Chords/Features
- **Check Tier**: Some features require Pro tier
- **Verify Copedent**: Ensure copedent supports desired chords
- **Interval Filters**: Check that required intervals aren't filtered out
- **Fret Range**: Expand search range if chords not found

#### Import/Export Issues
- **File Format**: Ensure using correct file extensions (.vlf, .cop, .amf)
- **File Size**: Large files may take time to process
- **Browser Support**: File operations work best in desktop browsers
- **Permissions**: Some browsers restrict file access

### Getting Help
- **Built-in Help**: Hover tooltips on most buttons
- **User Community**: Forums and Discord for user support
- **Bug Reports**: GitHub issues for technical problems
- **Feature Requests**: Feedback system for new features

### Performance Tips
- **Use Favorites**: Favorited chords load faster
- **Limit Results**: Reduce "Results Per Fret" for faster searches
- **Regular Cleanup**: Periodically clear cache and unused data
- **Keep Updated**: Latest versions include performance improvements

---

## Keyboard Shortcuts (Future)

### Global
- **Tab**: Navigate between interface elements
- **Enter**: Activate focused button
- **Escape**: Close modal dialogs
- **Space**: Play/pause audio

### Mode-Specific
- **CF Mode**: Number keys for quick root selection
- **VL Mode**: Arrow keys for chord navigation
- **General**: Ctrl/Cmd+S for save operations

---

## Advanced Tips & Tricks

### Workflow Optimization
- **Start with Favorites**: Build personal library of go-to voicings
- **Use Categories**: Organize progressions by style or project
- **Quality Focus**: Pay attention to transition costs in VL mode
- **Export Everything**: Regular PDF exports for offline practice

### Musical Applications
- **Voice Leading Study**: Use VL mode to understand smooth chord connections
- **Scale Relationships**: CF and SF modes show chord-scale relationships
- **Arrangement Ideas**: Different voicings inspire different musical arrangements
- **Practice Tool**: Export PDFs for focused practice sessions

### Collaboration
- **Share Copedents**: Exchange custom instrument configurations
- **Progression Libraries**: Build and share chord progression collections
- **Teaching Aid**: Export clear, readable charts for students
- **Band Communication**: Standard notation for communicating chord voicings

---

## Conclusion

PSG Compass is a comprehensive tool for pedal steel guitar players, offering everything from basic chord discovery to advanced voice leading optimization. The multi-tier approach ensures accessibility while providing powerful features for serious musicians.

**Key Strengths:**
- **Comprehensive Coverage**: All aspects of pedal steel harmony
- **Professional Quality**: Production-ready features and interface
- **User-Friendly**: Intuitive design with powerful functionality
- **Extensible**: Growing feature set with regular updates

**Getting the Most Value:**
1. **Start Simple**: Begin with Chord Finder to build familiarity
2. **Build Library**: Create favorite chord collection early
3. **Explore Advanced**: Gradually use more sophisticated features
4. **Share Knowledge**: Contribute to community learning

For additional support, updates, and community interaction, visit the PSG Compass website and user forums.

---

*This manual covers PSG Compass v0.9 (August 2025). Features and interface may evolve in future versions.*