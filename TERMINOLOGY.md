# Application Terminology & Abbreviations

This glossary defines the standard abbreviations and terminology used throughout PSG Compass and in development communications:

## Application Modes & Core Features

- **CF** = Chord Finder - Main chord discovery mode (Basic tier)
- **SF** = Scale Finder - Scale discovery and analysis mode (Basic tier)  
- **CD** = Chord Decipher - Fret position to chord identification (Pro tier)
- **VL** = Voice Leader - Advanced chord progression builder (Pro tier)
- **VLA** = Voice Leading Alternatives - Chord pool selection modal
- **RCM** = Radial Chord Menu - Circular chord selection interface
- **MG** = Measure Grid - Musical measure and beat organization system
- **PT** = Progression Tablature - Chord progression display system

## Musical Elements

- **P** = Pedal(s), can be numbered to specify (e.g., P1, P4, etc.)
- **L** = Lever(s) - refers to all knee levers (LKL, LKR, RKL, RKR, LV, RV and their second row: LKL2, LKR2, etc.)
- **M** = Mechanism(s), can be numbered to specify (e.g., M1, M5, etc.)
- **S** = String(s)
- **F** = Frets
- **Combo** or **P/L combo** or **P/L/M combo** = Combination of Pedals and/or Levers and/or Mechanisms

## File System & Data Management

- **CP** = Chord Progression(s) (also referring to CP files)
- **VLF** = Voice Leader File - Saved chord progression with voicings
- **Cop** = Copedent(s) - Instrument configuration files
- **AMF** = App Migration File - Complete app state export/import
- **PDF** = Portable Document Format exports for tablature

## User Interface Components

- **FV** = Fretboard Visualizer - Universal tablature display component
- **STB** = Star Toggle Button - Favorite chord management interface
- **MCB** = Multi-Customization Button - Cycling customization interface (🎛️)
- **EMP** = Expandable Management Panel - Customization management UI
- **SCM** = Save Customization Modal - User naming interface for customizations

## Advanced Features

- **FC** = Favorite Chord(s) - Saved chord configurations with customizations
- **MC** = Multi-Customization - Up to 5 saved variations per favorite chord
- **Directional Selection** = Voice leading calculation with movement patterns (Up, Down, ZigZag, Random)
- **Chord Locking** = Preserve individual chord voicings during recalculation

## Tier System

- **Basic Tier**: Access to CF, SF, and full copedent functionality
- **Pro Tier**: Additional access to CD and VL modes

## Musical Theory Terms

- **Root Independence** = Favorite chords work across all root notes
- **Enharmonic Spelling** = Context-aware chord naming (B♭ vs A♯ based on key)
- **Voice Leading** = Smooth movement between chord voicings
- **Intervallic Pattern** = Sequence of musical intervals defining chord/scale structure
- **Fret Range** = Specific fretboard positions (e.g., frets 3-12)

## File Format Conventions

- **`.vlf`** = Voice Leader File format
- **`.cop`** = Copedent configuration file format  
- **`.amf`** = App Migration File format
- **`.pdf`** = Tablature and chord chart exports

## Development & Technical Terms

- **Cache Hit** = Chord result retrieved from performance cache
- **State Object** = Mode-specific application state (finderState, vlState, etc.)
- **Context Provider** = React context for global state management
- **Memoization** = Performance optimization for expensive calculations
- **Debouncing** = Input delay optimization technique

## Usage Examples

- "The VL mode needs better P/L combo display in the PT"
- "CF results should show more S options per F range"  
- "This VLF has complex P1+L2 combos with high TC values"
- "The Cop editor needs M validation for new mechanisms"
- "Use directional selection with chord locking for better voice leading"
- "The FC system supports MC with up to 5 variations via MCB/EMP interface"
- "Use AMF for complete app state transfer between devices"

## Radial Chord Menu Conventions

### Wheel Structure & Naming

The RCM uses a three-concentric-circle system with standardized position numbering:

#### Circle Naming Convention:
- **O** = Outer circle (Major chords)
- **M** = Middle circle (Minor chords)  
- **I** = Inner circle (Diminished chords)

#### Position Numbering:
- **Positions 1-12** = Clock positions (1 o'clock through 12 o'clock)
- **Position 12** = 12 o'clock (top, -90° rotation)
- **Position 3** = 3 o'clock (right, 0° rotation)
- **Position 6** = 6 o'clock (bottom, 90° rotation)
- **Position 9** = 9 o'clock (left, 180° rotation)

#### Reference Format:
Use format `Circle-Position` when referencing specific locations:
- **O-12** = Outer circle, 12 o'clock position (Tonic major chord)
- **M-12** = Middle circle, 12 o'clock position (vi chord in major keys)
- **I-12** = Inner circle, 12 o'clock position (vii° chord)

## Button State Color Coding

- **Green Buttons** = Played chord tones (click to mute/grey)
- **Yellow Buttons** = Unison strings (click to mute/grey)
- **Grey Buttons** = Muted/off notes (click to restore original color)
- **Red Buttons** = Immutable unavailable notes (cannot be modified)
- **Light Blue Background** = Indicates favorited chord voicing

## Customization System Conventions

- **Default (0)** = Original calculated chord state
- **Customizations 1-5** = User-saved button state variations
- **Smart Names** = Auto-generated customization descriptions ("3 strings muted", "Bass only")
- **🎛️(n)** = Multi-customization button showing current state number
- **⚙️** = Management panel toggle button