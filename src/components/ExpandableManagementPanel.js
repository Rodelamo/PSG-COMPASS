// src/components/ExpandableManagementPanel.js

import React, { useEffect, useRef } from 'react';

/**
 * ExpandableManagementPanel Component
 * Cross-platform expandable panel for managing multiple chord customizations
 * Supports up to 5 customizations per favorite chord with full CRUD operations
 */
function ExpandableManagementPanel({
  isOpen,
  customizations = [],
  currentCustomization = 0,
  onSelect,
  onSave,
  onDelete,
  onClose,
  maxCustomizations = 5,
  chordName = 'Chord'
}) {
  const panelRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate only existing customizations (no empty slots to reduce height)
  const generateCustomizationOptions = () => {
    const options = [
      {
        id: 0,
        name: 'Default',
        description: 'Original chord without customizations',
        isEmpty: false,
        isDefault: true
      }
    ];

    // Add existing customizations only
    customizations.forEach((customization, index) => {
      options.push({
        id: customization.id || index + 1,
        name: customization.name || `Customization ${index + 1}`,
        description: customization.description || generateDescription(customization),
        isEmpty: false,
        isDefault: false,
        customization
      });
    });

    return options;
  };

  const generateDescription = (customization) => {
    if (customization.description) return customization.description;
    if (customization.mutedStrings && customization.mutedStrings.length > 0) {
      const count = customization.mutedStrings.length;
      return `${count} string${count > 1 ? 's' : ''} muted`;
    }
    return 'Custom chord voicing';
  };

  const handleRadioSelect = (optionId) => {
    if (onSelect) {
      onSelect(optionId);
    }
  };

  const handleSaveClick = () => {
    if (customizations.length >= maxCustomizations) {
      return; // Should be disabled, but extra safety
    }
    if (onSave) {
      onSave();
    }
  };

  const handleDeleteClick = () => {
    if (currentCustomization === 0) return; // Can't delete default
    if (onDelete) {
      onDelete(currentCustomization);
    }
  };

  if (!isOpen) return null;

  const options = generateCustomizationOptions();
  const canSave = customizations.length < maxCustomizations;
  const canDelete = currentCustomization > 0; // Can't delete default (0)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-20 z-40" />
      
      {/* Panel - Much more compact */}
      <div 
        ref={panelRef}
        className="absolute top-full left-0 z-50 mt-1.5rem bg-white rounded border border-gray-300 shadow-lg overflow-hidden"
        style={{
          maxHeight: '200px',
          minWidth: '300px',
          width: 'auto',
          animation: 'slideDown 0.15s ease-out'
        }}
      >
        {/* Minimal Header */}
        <div className="flex justify-between items-center px-3 py-1.5 border-b border-gray-200 bg-gray-50">
          <span className="text-sm font-medium text-gray-700">
            {chordName} Customizations
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Compact List */}
        <div className="p-2 max-h-32 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.id}
              className={`
                flex items-center justify-between px-2 py-1 mb-1 rounded text-xs cursor-pointer transition-colors
                ${currentCustomization === option.id 
                  ? 'bg-blue-100 border border-blue-300' 
                  : 'hover:bg-gray-50'
                }
              `}
              onClick={() => handleRadioSelect(option.id)}
            >
              <div className="flex items-center flex-grow">
                <input
                  type="radio"
                  name="customization"
                  value={option.id}
                  checked={currentCustomization === option.id}
                  onChange={() => {}}
                  className="w-3 h-3 mr-2"
                />
                <div>
                  <span className="font-medium">{option.name}</span>
                  {option.isDefault && <span className="text-gray-500 ml-1">(Default)</span>}
                  <div className="text-gray-500">{option.description}</div>
                </div>
              </div>
              {!option.isDefault && currentCustomization === option.id && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Minimal Footer */}
        <div className="px-2 py-1.5 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {customizations.length}/{maxCustomizations} slots
            </span>
            <button
              onClick={handleSaveClick}
              disabled={!canSave}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-colors
                ${canSave 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              + Save
            </button>
          </div>
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

export default ExpandableManagementPanel;