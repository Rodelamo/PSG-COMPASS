// src/components/ProgressionSelectionMenu.js

import React, { useState } from 'react';
import { PROGRESSION_CATEGORIES } from '../data/DefaultProgressions';
import { getRomanNumeral, getNashvilleNumber } from '../utils/ChordAnalysis';

const ProgressionSelectionMenu = ({ 
  isOpen, 
  onClose, 
  onProgressionSelect,
  position = { x: 0, y: 0 }
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [progressionSource, setProgressionSource] = useState('default'); // 'default' or 'custom'
  const [userProgressions, setUserProgressions] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [progressionToDelete, setProgressionToDelete] = useState(null);
  
  // Category management state
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [showRenameCategoryDialog, setShowRenameCategoryDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryToRename, setCategoryToRename] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Progression management state
  const [showRenameProgressionDialog, setShowRenameProgressionDialog] = useState(false);
  const [showMoveProgressionDialog, setShowMoveProgressionDialog] = useState(false);
  const [progressionToRename, setProgressionToRename] = useState(null);
  const [progressionToMove, setProgressionToMove] = useState(null);
  const [newProgressionName, setNewProgressionName] = useState('');
  const [targetCategory, setTargetCategory] = useState('Custom');
  
  // Load user progressions from localStorage with migration
  React.useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('savedProgressions');
        if (saved) {
          const progressions = JSON.parse(saved);
          // Migrate progressions without category to 'Custom'
          const migratedProgressions = progressions.map(prog => ({
            ...prog,
            category: prog.category || 'Custom'
          }));
          
          // Save migrated data back if any changes were made
          const needsMigration = progressions.some(prog => !prog.category);
          if (needsMigration) {
            localStorage.setItem('savedProgressions', JSON.stringify(migratedProgressions));
          }
          
          setUserProgressions(migratedProgressions);
        }
      } catch (error) {
        console.error('Error loading user progressions:', error);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get custom categories from user progressions
  const getCustomCategories = () => {
    // Get unique categories from progressions
    const categories = ['Custom']; // Always include Custom as first
    const otherCategories = [...new Set(userProgressions.map(prog => prog.category || 'Custom'))]
      .filter(cat => cat !== 'Custom')
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    return categories.concat(otherCategories);
  };
  
  // Get progressions for a specific category
  const getProgressionsForCategory = (categoryName) => {
    return userProgressions
      .filter(prog => (prog.category || 'Custom') === categoryName)
      .map(prog => {
        // Use the progression's original key for analysis
        const originalKey = prog.tonalCenter || 'C';
        
        // Analyze chords in their original key context
        const romanNumerals = prog.measures?.map(m => {
          const chord = m.slots?.[0]?.chord;
          return chord ? getRomanNumeral(chord, originalKey) : '—';
        }).filter(numeral => numeral !== '—') || ['Custom'];
        
        const nashvilleNumbers = prog.measures?.map(m => {
          const chord = m.slots?.[0]?.chord;
          return chord ? getNashvilleNumber(chord, originalKey) : '—';
        }).filter(number => number !== '—') || ['Custom'];
        
        return {
          name: prog.name,
          description: `Saved ${new Date(prog.timestamp).toLocaleDateString()}`,
          romanNumerals,
          nashvilleNumbers,
          originalData: prog // Store original progression data
        };
      });
  };
  
  // Get current data source
  const getCurrentData = () => {
    if (progressionSource === 'custom') {
      const customCategories = getCustomCategories();
      const categoriesWithProgressions = customCategories.map(catName => ({
        name: catName,
        progressions: getProgressionsForCategory(catName)
      }));
      
      return {
        categories: categoriesWithProgressions,
        currentCategory: categoriesWithProgressions[selectedCategory] || { name: 'Custom', progressions: [] }
      };
    } else {
      return {
        categories: PROGRESSION_CATEGORIES,
        currentCategory: PROGRESSION_CATEGORIES[selectedCategory]
      };
    }
  };

  const { categories, currentCategory } = getCurrentData();
  
  // Category management functions
  const validateCategoryName = (name) => {
    if (!name || name.trim().length === 0) {
      return "Category name cannot be empty";
    }
    if (name.length > 35) {
      return "Category name cannot exceed 35 characters";
    }
    const existingCategories = getCustomCategories().map(cat => cat.toLowerCase());
    if (existingCategories.includes(name.toLowerCase())) {
      return "A category with this name already exists";
    }
    return null;
  };
  
  const createCategory = (categoryName) => {
    const validationError = validateCategoryName(categoryName);
    if (validationError) {
      return validationError;
    }
    
    // Categories are created dynamically when progressions are saved to them
    // But we can create an empty placeholder progression to establish the category
    try {
      // Create a placeholder progression in the new category
      const placeholderProgression = {
        name: `Welcome to ${categoryName}`,
        category: categoryName,
        timestamp: new Date().toISOString(),
        measures: [{
          id: 0,
          slots: [
            { beat: 1, chord: null },
            { beat: 2, chord: null },
            { beat: 3, chord: null },
            { beat: 4, chord: null }
          ]
        }],
        timeSignature: '4/4',
        tonalCenter: 'C',
        tempo: 120,
        version: "1.0",
        isPlaceholder: true // Mark as placeholder
      };
      
      const savedProgressions = JSON.parse(localStorage.getItem('savedProgressions') || '[]');
      savedProgressions.push(placeholderProgression);
      localStorage.setItem('savedProgressions', JSON.stringify(savedProgressions));
      setUserProgressions(savedProgressions);
      
      setShowCreateCategoryDialog(false);
      setNewCategoryName('');
      return null;
    } catch (error) {
      console.error('Error creating category:', error);
      return "Error creating category";
    }
  };
  
  const deleteCategory = (categoryName) => {
    if (categoryName === 'Custom') {
      return "Cannot delete the Custom category";
    }
    
    try {
      // Move all progressions from deleted category to 'Custom'
      const updatedProgressions = userProgressions.map(prog => ({
        ...prog,
        category: prog.category === categoryName ? 'Custom' : prog.category
      }));
      
      localStorage.setItem('savedProgressions', JSON.stringify(updatedProgressions));
      setUserProgressions(updatedProgressions);
      
      // Reset selection to Custom category
      setSelectedCategory(0);
      
      return null;
    } catch (error) {
      console.error('Error deleting category:', error);
      return "Error deleting category";
    }
  };
  
  const renameCategory = (oldName, newName) => {
    if (oldName === 'Custom') {
      return "Cannot rename the Custom category";
    }
    
    const validationError = validateCategoryName(newName);
    if (validationError) {
      return validationError;
    }
    
    try {
      // Update all progressions with the old category name
      const updatedProgressions = userProgressions.map(prog => ({
        ...prog,
        category: prog.category === oldName ? newName : prog.category
      }));
      
      localStorage.setItem('savedProgressions', JSON.stringify(updatedProgressions));
      setUserProgressions(updatedProgressions);
      
      return null;
    } catch (error) {
      console.error('Error renaming category:', error);
      return "Error renaming category";
    }
  };
  
  // Progression management functions
  const renameProgression = (progression, newName) => {
    if (!newName || newName.trim().length === 0) {
      return "Progression name cannot be empty";
    }
    if (newName.length > 50) {
      return "Progression name cannot exceed 50 characters";
    }
    
    try {
      const updatedProgressions = userProgressions.map(prog => 
        prog.timestamp === progression.timestamp 
          ? { ...prog, name: newName.trim() }
          : prog
      );
      
      localStorage.setItem('savedProgressions', JSON.stringify(updatedProgressions));
      setUserProgressions(updatedProgressions);
      
      return null;
    } catch (error) {
      console.error('Error renaming progression:', error);
      return "Error renaming progression";
    }
  };
  
  const moveProgression = (progression, targetCategory) => {
    try {
      const updatedProgressions = userProgressions.map(prog => 
        prog.timestamp === progression.timestamp 
          ? { ...prog, category: targetCategory }
          : prog
      );
      
      localStorage.setItem('savedProgressions', JSON.stringify(updatedProgressions));
      setUserProgressions(updatedProgressions);
      
      return null;
    } catch (error) {
      console.error('Error moving progression:', error);
      return "Error moving progression";
    }
  };

  const handleProgressionClick = (progression) => {
    // If it's a custom progression, handle differently
    if (progression.originalData) {
      // Validate category on import - if unknown, move to Custom
      const validatedProgression = {
        ...progression.originalData,
        category: getCustomCategories().includes(progression.originalData.category || 'Custom') 
          ? (progression.originalData.category || 'Custom')
          : 'Custom'
      };
      
      // For saved progressions, we need to directly load the measure data
      onProgressionSelect(validatedProgression);
    } else {
      // For default progressions, use the existing conversion logic
      onProgressionSelect(progression);
    }
    onClose();
  };

  const handleDeleteProgression = (progressionToDelete, event) => {
    // Prevent the card click from firing
    event.stopPropagation();
    setProgressionToDelete(progressionToDelete);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProgression = () => {
    console.log('Confirm delete called for:', progressionToDelete);
    if (progressionToDelete && progressionToDelete.originalData) {
      try {
        console.log('Current userProgressions:', userProgressions);
        console.log('Deleting progression with timestamp:', progressionToDelete.originalData.timestamp);
        
        // Remove from localStorage
        const updatedProgressions = userProgressions.filter(
          prog => prog.timestamp !== progressionToDelete.originalData.timestamp
        );
        
        console.log('Updated progressions after filter:', updatedProgressions);
        localStorage.setItem('savedProgressions', JSON.stringify(updatedProgressions));
        
        // Update local state
        setUserProgressions(updatedProgressions);
        
        // Close dialog
        setShowDeleteDialog(false);
        setProgressionToDelete(null);
        
        console.log('Delete completed successfully');
      } catch (error) {
        console.error('Error deleting progression:', error);
      }
    } else {
      console.log('No progression to delete or missing originalData');
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setProgressionToDelete(null);
  };
  
  // Category dialog handlers
  const handleCreateCategory = () => {
    const error = createCategory(newCategoryName);
    if (error) {
      alert(error); // In a real app, you'd show this in a toast
    }
  };
  
  const handleDeleteCategory = () => {
    const categoryToDeleteName = categories[selectedCategory]?.name;
    if (categoryToDeleteName === 'Custom') {
      alert('Cannot delete the Custom category');
      return;
    }
    setCategoryToDelete(categoryToDeleteName);
    setShowDeleteCategoryDialog(true);
  };
  
  const confirmDeleteCategory = () => {
    const error = deleteCategory(categoryToDelete);
    if (error) {
      alert(error);
    }
    setShowDeleteCategoryDialog(false);
    setCategoryToDelete(null);
  };
  
  const handleRenameCategory = (categoryName) => {
    setCategoryToRename(categoryName);
    setNewCategoryName(categoryName);
    setShowRenameCategoryDialog(true);
  };
  
  const confirmRenameCategory = () => {
    const error = renameCategory(categoryToRename, newCategoryName);
    if (error) {
      alert(error);
    } else {
      setShowRenameCategoryDialog(false);
      setCategoryToRename(null);
      setNewCategoryName('');
    }
  };
  
  // Progression dialog handlers
  const handleRenameProgression = (progression, event) => {
    event.stopPropagation();
    setProgressionToRename(progression);
    setNewProgressionName(progression.name);
    setShowRenameProgressionDialog(true);
  };
  
  const confirmRenameProgression = () => {
    const error = renameProgression(progressionToRename.originalData, newProgressionName);
    if (error) {
      alert(error);
    } else {
      setShowRenameProgressionDialog(false);
      setProgressionToRename(null);
      setNewProgressionName('');
    }
  };
  
  const handleMoveProgression = (progression, event) => {
    event.stopPropagation();
    setProgressionToMove(progression);
    setTargetCategory('Custom');
    setShowMoveProgressionDialog(true);
  };
  
  const confirmMoveProgression = () => {
    const error = moveProgression(progressionToMove.originalData, targetCategory);
    if (error) {
      alert(error);
    } else {
      setShowMoveProgressionDialog(false);
      setProgressionToMove(null);
      setTargetCategory('Custom');
    }
  };

  return (
    <>
      {/* Full-screen backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={onClose}
      />
      
      {/* Full-screen container */}
      <div className="fixed inset-0 z-50 flex bg-white">
        {/* Left sidebar: Categories */}
        <div className="w-80 bg-gray-100 border-r border-gray-300 flex flex-col">
          {/* Header with toggle */}
          <div className="p-6 border-b border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Load Progression</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Default CP / User Custom CP Toggle */}
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => {
                  setProgressionSource('default');
                  setSelectedCategory(0);
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  progressionSource === 'default'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Default CP
              </button>
              <button
                onClick={() => {
                  setProgressionSource('custom');
                  setSelectedCategory(0);
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  progressionSource === 'custom'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                User Custom CP
              </button>
            </div>
          </div>
          
          {/* Category Management Buttons (only in custom mode) */}
          {progressionSource === 'custom' && (
            <div className="px-4 pb-4 border-b border-gray-300">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setNewCategoryName('');
                    setShowCreateCategoryDialog(true);
                  }}
                  className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Category
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Erase Category
                </button>
              </div>
            </div>
          )}

          {/* Category list */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {categories.map((category, index) => (
                <div key={index} className="relative">
                  <button
                    onClick={() => setSelectedCategory(index)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === index
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex-1 pr-2">{category.name}</span>
                      <span className="text-xs opacity-75">
                        {category.progressions.length}
                      </span>
                    </div>
                  </button>
                  
                  {/* Rename button for custom categories (except Custom) */}
                  {progressionSource === 'custom' && category.name !== 'Custom' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameCategory(category.name);
                      }}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-500 text-white rounded-full hover:bg-gray-600 flex items-center justify-center text-xs transition-colors"
                      title="Rename category"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Empty state for custom progressions */}
            {progressionSource === 'custom' && userProgressions.length === 0 && (
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>No custom progressions found</strong>
                </p>
                <p className="text-xs text-yellow-600">
                  Create progressions in Voice Leader and save them to see them here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right content: Progression list */}
        <div className="flex-1 flex flex-col">
          {/* Content header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentCategory.name}</h2>
            <p className="text-gray-600">
              {currentCategory.progressions.length} progression{currentCategory.progressions.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Progression grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentCategory.progressions.map((progression, index) => (
                <div
                  key={index}
                  onClick={() => handleProgressionClick(progression)}
                  className="relative p-5 bg-white hover:bg-blue-50 rounded-xl cursor-pointer transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:shadow-md"
                >
                  {/* Management buttons for custom progressions */}
                  {progressionSource === 'custom' && progression.originalData && (
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {/* Rename button */}
                      <button
                        onClick={(e) => handleRenameProgression(progression, e)}
                        className="w-5 h-5 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center text-xs font-bold shadow opacity-70 hover:opacity-100 transition-opacity z-10"
                        title="Rename progression"
                      >
                        ✏️
                      </button>
                      
                      {/* Move button */}
                      <button
                        onClick={(e) => handleMoveProgression(progression, e)}
                        className="w-5 h-5 bg-purple-500 text-white rounded-full hover:bg-purple-600 flex items-center justify-center text-xs font-bold shadow opacity-70 hover:opacity-100 transition-opacity z-10"
                        title="Move to category"
                      >
                        ↔
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteProgression(progression, e)}
                        className="w-5 h-5 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-sm font-bold shadow opacity-70 hover:opacity-100 transition-opacity z-10"
                        title="Delete progression"
                        style={{ lineHeight: '1' }}
                      >
                        <span style={{ transform: 'translateY(-1px)' }}>−</span>
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col h-full">
                    <h4 className="font-bold text-gray-800 mb-2 text-lg">{progression.name}</h4>
                    <p className="text-sm text-gray-600 mb-4 flex-1">{progression.description}</p>
                    
                    {/* Roman Numerals Display */}
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                        Roman Analysis
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {progression.originalData?.isPlaceholder ? (
                          <span className="text-xs text-gray-500 italic px-2 py-1">
                            Empty category - add progressions here
                          </span>
                        ) : (
                          <>
                            {progression.romanNumerals.slice(0, 8).map((roman, i) => (
                              <span key={i} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border">
                                {roman}
                              </span>
                            ))}
                            {progression.romanNumerals.length > 8 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{progression.romanNumerals.length - 8} more
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Nashville Numbers Display */}
                    <div className="mb-4">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                        Nashville Numbers
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {progression.originalData?.isPlaceholder ? (
                          <span className="text-xs text-gray-500 italic px-2 py-1">
                            Start saving progressions to this category
                          </span>
                        ) : (
                          <>
                            {progression.nashvilleNumbers.slice(0, 8).map((number, i) => (
                              <span key={i} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border">
                                {number}
                              </span>
                            ))}
                            {progression.nashvilleNumbers.length > 8 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{progression.nashvilleNumbers.length - 8} more
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                      <span>{progression.romanNumerals.length} chord{progression.romanNumerals.length !== 1 ? 's' : ''}</span>
                      {progressionSource === 'custom' && progression.originalData && (
                        <span>{new Date(progression.originalData.timestamp).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {currentCategory.progressions.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-500 text-lg mb-2">No progressions in this category</p>
                  <p className="text-gray-400 text-sm">
                    {progressionSource === 'custom' 
                      ? 'Save some progressions to see them here' 
                      : 'This category is currently empty'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Progression Confirmation Dialog */}
      {showDeleteDialog && (
        <>
          {/* Dialog backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={cancelDelete}
          />
          
          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Progression</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{progressionToDelete?.name}"? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProgression}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Create Category Dialog */}
      {showCreateCategoryDialog && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCreateCategoryDialog(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Category</h3>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name (max 35 characters)"
                maxLength={35}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => {setShowCreateCategoryDialog(false); setNewCategoryName('');}}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Delete Category Dialog */}
      {showDeleteCategoryDialog && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDeleteCategoryDialog(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Category</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the "{categoryToDelete}" category? This action cannot be undone and all progressions in this category will be moved to the "Custom" category.
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => {setShowDeleteCategoryDialog(false); setCategoryToDelete(null);}}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
                >
                  Erase and Continue
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Rename Category Dialog */}
      {showRenameCategoryDialog && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowRenameCategoryDialog(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Rename Category</h3>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name (max 35 characters)"
                maxLength={35}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                onKeyPress={(e) => e.key === 'Enter' && confirmRenameCategory()}
              />
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => {setShowRenameCategoryDialog(false); setCategoryToRename(null); setNewCategoryName('');}}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRenameCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Rename Progression Dialog */}
      {showRenameProgressionDialog && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowRenameProgressionDialog(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Rename Progression</h3>
              <input
                type="text"
                value={newProgressionName}
                onChange={(e) => setNewProgressionName(e.target.value)}
                placeholder="Progression name (max 50 characters)"
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                onKeyPress={(e) => e.key === 'Enter' && confirmRenameProgression()}
              />
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => {setShowRenameProgressionDialog(false); setProgressionToRename(null); setNewProgressionName('');}}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRenameProgression}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Move Progression Dialog */}
      {showMoveProgressionDialog && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMoveProgressionDialog(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Move Progression</h3>
              <p className="text-gray-600 mb-4">Move "{progressionToMove?.name}" to:</p>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              >
                {getCustomCategories().map(categoryName => (
                  <option key={categoryName} value={categoryName}>{categoryName}</option>
                ))}
              </select>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => {setShowMoveProgressionDialog(false); setProgressionToMove(null); setTargetCategory('Custom');}}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMoveProgression}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition-colors"
                >
                  Move
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ProgressionSelectionMenu;