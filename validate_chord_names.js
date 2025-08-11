// validate_chord_names.js - Comprehensive chord naming validation

const { CHORD_CATEGORIES } = require('./src/data/DefaultChordTypes.js');
const { convertToConventionalName, hasConventionalName } = require('./src/utils/ChordNaming.js');
const { convertChordToSymbol } = require('./src/utils/ChordSymbols.js');

console.log('🎵 COMPREHENSIVE CHORD NAME VALIDATION');
console.log('=====================================\n');

// Extract all chord types
const allChordTypes = CHORD_CATEGORIES.flatMap(cat => cat.chords.map(chord => chord.name));
console.log(`Total chord types to validate: ${allChordTypes.length}\n`);

// Test each chord type with C as root
let validatedCount = 0;
let issuesFound = [];

console.log('ROOT: C | TYPE | LETTERS MODE | SYMBOLS MODE | STATUS');
console.log('----------------------------------------------------------');

allChordTypes.forEach(chordType => {
  const testChord = { root: 'C', type: chordType };
  
  try {
    const lettersMode = convertToConventionalName(testChord);
    const symbolsMode = convertChordToSymbol(testChord);
    const hasMappingLetters = hasConventionalName(chordType);
    
    // Check for issues
    let status = '✅ OK';
    if (!hasMappingLetters) {
      status = '⚠️  FALLBACK';
      issuesFound.push({
        type: chordType,
        letters: lettersMode,
        symbols: symbolsMode,
        issue: 'Using fallback naming'
      });
    }
    
    if (lettersMode.includes(' ')) {
      status = '❌ SPACES';
      issuesFound.push({
        type: chordType,
        letters: lettersMode,
        symbols: symbolsMode,
        issue: 'Contains spaces in letters mode'
      });
    }
    
    console.log(`C | ${chordType.padEnd(25)} | ${lettersMode.padEnd(12)} | ${symbolsMode.padEnd(12)} | ${status}`);
    validatedCount++;
    
  } catch (error) {
    console.log(`C | ${chordType.padEnd(25)} | ERROR | ERROR | ❌ FAILED`);
    issuesFound.push({
      type: chordType,
      letters: 'ERROR',
      symbols: 'ERROR',
      issue: error.message
    });
  }
});

console.log('\n=====================================');
console.log(`✅ Successfully validated: ${validatedCount}/${allChordTypes.length} chord types`);
console.log(`⚠️  Issues found: ${issuesFound.length}`);

if (issuesFound.length > 0) {
  console.log('\n🔍 DETAILED ISSUES:');
  console.log('==================');
  issuesFound.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.type}`);
    console.log(`   Letters: "${issue.letters}"`);
    console.log(`   Symbols: "${issue.symbols}"`);
    console.log(`   Issue: ${issue.issue}\n`);
  });
}

// Test with different roots to ensure consistency
console.log('🎸 TESTING WITH DIFFERENT ROOTS:');
console.log('================================');
const testRoots = ['C', 'F#', 'Bb', 'D#'];
const testChordTypes = ['Major Triad', 'Minor 7th', 'Dominant 9', 'Major 13#11'];

testChordTypes.forEach(chordType => {
  console.log(`\n${chordType}:`);
  testRoots.forEach(root => {
    const testChord = { root, type: chordType };
    const letters = convertToConventionalName(testChord);
    const symbols = convertChordToSymbol(testChord);
    console.log(`  ${root}: Letters="${letters}" | Symbols="${symbols}"`);
  });
});

console.log('\n🎯 VALIDATION COMPLETE!');