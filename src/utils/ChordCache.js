// src/utils/ChordCache.js

/**
 * Chord calculation caching system for performance optimization
 * Prevents redundant chord voicing calculations when the same chord appears multiple times
 */

class ChordCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
  }

  /**
   * Generate a unique cache key for chord voicing parameters
   */
  generateKey(copedentId, root, type, intervals, resultsPerFret, hasFullAccess) {
    const sortedIntervals = [...intervals].sort((a, b) => a - b).join(',');
    const accessLevel = hasFullAccess ? 'full' : 'limited';
    return `${copedentId}-${root}-${type}-${sortedIntervals}-${resultsPerFret}-${accessLevel}`;
  }

  /**
   * Get cached chord voicings if available
   */
  get(copedentId, root, type, intervals, resultsPerFret, hasFullAccess) {
    this.stats.totalRequests++;
    const key = this.generateKey(copedentId, root, type, intervals, resultsPerFret, hasFullAccess);
    
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      cached.hitCount++;
      cached.lastAccessed = Date.now();
      this.stats.hits++;
      
      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 Cache HIT for ${root} ${type} (hit #${cached.hitCount})`);
      }
      
      // Return a deep copy to prevent mutation of cached data
      return this.deepCopyVoicings(cached.voicings);
    }
    
    this.stats.misses++;
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Cache MISS for ${root} ${type} - calculating...`);
    }
    
    return null;
  }

  /**
   * Store chord voicings in cache
   */
  set(copedentId, root, type, intervals, resultsPerFret, hasFullAccess, voicings) {
    const key = this.generateKey(copedentId, root, type, intervals, resultsPerFret, hasFullAccess);
    
    // Store a deep copy to prevent external mutation
    this.cache.set(key, {
      voicings: this.deepCopyVoicings(voicings),
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      hitCount: 0,
      copedentId,
      root,
      type
    });
  }

  /**
   * Deep copy voicings to prevent cache pollution
   */
  deepCopyVoicings(voicings) {
    return voicings.map(voicing => ({
      ...voicing,
      notes: voicing.notes.map(note => ({ ...note })),
      pedalCombo: [...voicing.pedalCombo],
      leverCombo: [...voicing.leverCombo],
      mecCombo: [...voicing.mecCombo],
      score: { ...voicing.score }
    }));
  }

  /**
   * Clear cache entries for a specific copedent
   */
  clearByCopedent(copedentId) {
    let cleared = 0;
    for (const [key, value] of this.cache.entries()) {
      if (value.copedentId === copedentId) {
        this.cache.delete(key);
        cleared++;
      }
    }
    return cleared;
  }

  /**
   * Clear cache entries for a specific chord type
   */
  clearByChordType(type) {
    let cleared = 0;
    for (const [key, value] of this.cache.entries()) {
      if (value.type === type) {
        this.cache.delete(key);
        cleared++;
      }
    }
    return cleared;
  }

  /**
   * Clear all cache entries
   */
  clearAll() {
    const size = this.cache.size;
    this.cache.clear();
    this.resetStats();
    return size;
  }

  /**
   * Remove old cache entries based on age or usage
   */
  cleanup(maxAge = 1000 * 60 * 30, maxSize = 1000) { // 30 minutes, 1000 entries
    const now = Date.now();
    let cleaned = 0;

    // Remove entries older than maxAge
    for (const [key, value] of this.cache.entries()) {
      if (now - value.lastAccessed > maxAge) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    // If still too large, remove least recently used entries
    if (this.cache.size > maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const toRemove = entries.slice(0, this.cache.size - maxSize);
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
        cleaned++;
      });
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests * 100).toFixed(1)
      : '0.0';

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    for (const [key, value] of this.cache.entries()) {
      totalSize += key.length * 2; // rough string size
      totalSize += JSON.stringify(value).length * 2; // rough object size
    }
    return `${(totalSize / 1024).toFixed(1)} KB`;
  }

  /**
   * Get most frequently used cache entries
   */
  getMostUsed(limit = 10) {
    return Array.from(this.cache.entries())
      .sort(([, a], [, b]) => b.hitCount - a.hitCount)
      .slice(0, limit)
      .map(([key, value]) => ({
        key,
        root: value.root,
        type: value.type,
        hitCount: value.hitCount,
        lastAccessed: new Date(value.lastAccessed).toLocaleString()
      }));
  }
}

// Create singleton instance
const chordCache = new ChordCache();

export default chordCache;