// src/components/VLFileModal.js

import React, { useState, useEffect } from 'react';
import { 
  getSavedVLFiles, 
  deleteVLFileFromStorage, 
  renameVLFile,
  getVLFileCategories,
  getVLFilesByCategory,
  addCustomCategory,
  deleteCustomCategory,
  getAllCategories,
  getCustomCategories
} from '../utils/VLFileStorage';

const VLFileModal = ({ 
  isOpen, 
  onClose, 
  onLoadVLFile, 
  mode = 'load' // 'load', 'save', 'manage'
}) => {
  const [savedFiles, setSavedFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('User Arrangements');
  const [categories, setCategories] = useState(['User Arrangements']);
  const [editingFile, setEditingFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'chords'
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
      loadCategories();
    }
  }, [isOpen]);

  const loadFiles = () => {
    const files = getSavedVLFiles();
    setSavedFiles(files);
  };

  const loadCategories = () => {
    setCategories(getAllCategories());
    setCustomCategories(getCustomCategories());
  };

  const filteredFiles = () => {
    let files = getVLFilesByCategory(selectedCategory);
    
    // Apply search filter
    if (searchTerm) {
      files = files.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    files.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'chords':
          return (b.statistics?.totalChords || 0) - (a.statistics?.totalChords || 0);
        case 'date':
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });
    
    return files;
  };

  const handleLoadFile = (file) => {
    onLoadVLFile(file);
    onClose();
  };

  const handleDeleteFile = async (fileName) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      const result = deleteVLFileFromStorage(fileName);
      if (result.success) {
        loadFiles();
      } else {
        alert(result.message);
      }
    }
  };

  const handleRenameFile = (file) => {
    setEditingFile(file);
    setNewFileName(file.name);
  };

  const confirmRename = () => {
    if (!newFileName.trim()) return;
    
    const result = renameVLFile(editingFile.name, newFileName.trim());
    if (result.success) {
      loadFiles();
      setEditingFile(null);
      setNewFileName('');
    } else {
      alert(result.message);
    }
  };

  const cancelRename = () => {
    setEditingFile(null);
    setNewFileName('');
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const result = addCustomCategory(newCategoryName.trim());
    if (result.success) {
      loadCategories();
      setNewCategoryName('');
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleDeleteCategory = (categoryName) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"?\nFiles in this category will be moved to "User Arrangements".`)) {
      const result = deleteCustomCategory(categoryName);
      if (result.success) {
        loadCategories();
        loadFiles(); // Reload files since they may have been moved
        if (selectedCategory === categoryName) {
          setSelectedCategory('User Arrangements');
        }
        alert(result.message);
      } else {
        alert(result.message);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800">
              {mode === 'save' ? 'Save VL Arrangement' : 
               mode === 'manage' ? 'Manage VL Files' : 
               'Load VL Arrangement'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                {/* Category Management Button */}
                <button
                  onClick={() => setShowCategoryManager(!showCategoryManager)}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 transition-colors"
                  title="Manage categories"
                >
                  ⚙️
                </button>
              </div>

              {/* Category Manager */}
              {showCategoryManager && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">Manage Categories</h4>
                    <button
                      onClick={() => setShowCategoryManager(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Add Category */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={30}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCategory();
                        }}
                      />
                      <button
                        onClick={handleAddCategory}
                        disabled={!newCategoryName.trim()}
                        className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  {/* Custom Categories List */}
                  {customCategories.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Custom Categories:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {customCategories.map(category => (
                          <div key={category} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                            <span className="text-sm">{category}</span>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-500 hover:text-red-700 text-xs"
                              title={`Delete ${category}`}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {customCategories.length === 0 && (
                    <p className="text-xs text-gray-500">No custom categories yet. Add one above!</p>
                  )}
                </div>
              )}

              {/* Search */}
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <label className="text-sm font-medium text-gray-700">Search:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search files..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date Modified</option>
                  <option value="name">Name</option>
                  <option value="chords">Chord Count</option>
                </select>
              </div>
            </div>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredFiles().length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-500 text-lg mb-2">
                    {searchTerm ? 'No files match your search' : 'No VL files found'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {searchTerm ? 'Try a different search term' : 'Create and save some arrangements to see them here'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFiles().map((file, index) => (
                  <div
                    key={index}
                    className="p-5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    {/* File header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {editingFile && editingFile.name === file.name ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') confirmRename();
                                if (e.key === 'Escape') cancelRename();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={confirmRename}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelRename}
                              className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <h4 className="font-bold text-gray-800 text-lg mb-1">{file.name}</h4>
                        )}
                        <p className="text-sm text-gray-600 mb-2">{file.description}</p>
                        {file.author && (
                          <p className="text-xs text-gray-500">by {file.author}</p>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-1 ml-2">
                        {mode === 'manage' && (
                          <>
                            <button
                              onClick={() => handleRenameFile(file)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Rename file"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.name)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete file"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* File info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Key:</span>
                        <span className="font-medium">{file.arrangement.tonalCenter}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Time:</span>
                        <span className="font-medium">{file.arrangement.timeSignature}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Tempo:</span>
                        <span className="font-medium">{file.arrangement.tempo} BPM</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Measures:</span>
                        <span className="font-medium">{file.statistics.totalMeasures}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Chords:</span>
                        <span className="font-medium">{file.statistics.totalChords}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {file.tags && file.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{new Date(file.timestamp).toLocaleDateString()}</span>
                      <span>{file.statistics.hasResults ? 'Has Tablature' : 'No Tablature'}</span>
                    </div>

                    {/* Load button */}
                    <button
                      onClick={() => handleLoadFile(file)}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Load Arrangement
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {filteredFiles().length} file{filteredFiles().length !== 1 ? 's' : ''} in {selectedCategory}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VLFileModal;