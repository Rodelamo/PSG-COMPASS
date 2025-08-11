// src/components/SaveCustomizationModal.js

import React, { useState, useEffect, useRef } from 'react';

/**
 * SaveCustomizationModal Component
 * Modal dialog for naming and saving chord customizations
 * Provides smart name suggestions and validation
 */
function SaveCustomizationModal({
  isOpen,
  onSave,
  onCancel,
  suggestedName = '',
  maxCustomizations = 5,
  currentCount = 0,
  chordName = 'Chord'
}) {
  const [customizationName, setCustomizationName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  // Reset and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomizationName(suggestedName);
      setIsSaving(false);
      // Focus input after a short delay to ensure modal is rendered
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select(); // Select all text for easy editing
        }
      }, 100);
    }
  }, [isOpen, suggestedName]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCancel();
      } else if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, customizationName]);

  const handleSave = async () => {
    const trimmedName = customizationName.trim();
    
    if (!trimmedName) {
      inputRef.current?.focus();
      return;
    }

    if (currentCount >= maxCustomizations) {
      return; // Should be disabled, but extra safety
    }

    setIsSaving(true);
    
    try {
      if (onSave) {
        await onSave(trimmedName);
      }
    } catch (error) {
      console.error('Error saving customization:', error);
      setIsSaving(false);
      // Error handling should be done by parent component
      return;
    }
    
    setIsSaving(false);
    setCustomizationName('');
  };

  const handleCancel = () => {
    setCustomizationName('');
    setIsSaving(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleInputChange = (e) => {
    setCustomizationName(e.target.value);
  };

  const isNameValid = customizationName.trim().length > 0;
  const canSave = isNameValid && currentCount < maxCustomizations && !isSaving;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleCancel}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Save Customization
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Save current button states for {chordName}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <label 
                htmlFor="customization-name" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Customization Name
              </label>
              <input
                ref={inputRef}
                id="customization-name"
                type="text"
                value={customizationName}
                onChange={handleInputChange}
                placeholder="Enter a descriptive name..."
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                style={{ minHeight: '44px' }} // Touch-friendly
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {customizationName.length}/50 characters
                </span>
                {!isNameValid && customizationName.length > 0 && (
                  <span className="text-xs text-red-500">
                    Name cannot be empty
                  </span>
                )}
              </div>
            </div>

            {/* Usage Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">ℹ️</span>
                <div className="text-sm text-blue-800">
                  <div className="font-medium">
                    Using {currentCount + 1} of {maxCustomizations} slots
                  </div>
                  <div className="text-xs mt-1 text-blue-600">
                    This customization will be available for all root notes of this chord type and combo.
                  </div>
                </div>
              </div>
            </div>

            {currentCount >= maxCustomizations && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">⚠️</span>
                  <div className="text-sm text-red-800">
                    Maximum customizations reached. Delete an existing customization first.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '44px' }} // Touch-friendly
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`
                px-4 py-2 text-sm font-medium rounded-md focus:ring-2 focus:ring-offset-2 transition-all duration-200
                ${canSave 
                  ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                }
                ${isSaving ? 'opacity-75' : ''}
              `}
              style={{ minHeight: '44px' }} // Touch-friendly
            >
              {isSaving ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Saving...
                </>
              ) : (
                'Save Customization'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SaveCustomizationModal;