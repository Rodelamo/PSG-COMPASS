// src/components/VLFileManager.js

import React, { useState } from 'react';
import VLFileModal from './VLFileModal';
import { 
  createVLFileData, 
  saveVLFileToStorage, 
  exportVLFileToDownload, 
  importVLFileFromUpload,
  extractVLState,
  getAllCategories
} from '../utils/VLFileStorage';
import { useToast } from '../App';

const VLFileManager = ({ 
  appState, 
  setAppState, 
  selectedCopedent,
  onLoadVLFile 
}) => {
  const [isVLModalOpen, setIsVLModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('load'); // 'load', 'save', 'manage'
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    name: '',
    description: '',
    author: '',
    tags: '',
    category: 'User Arrangements'
  });
  const showToast = useToast();

  const handleSaveVLFile = () => {
    setIsSaveModalOpen(true);
    setSaveFormData({
      name: `VL Arrangement ${new Date().toLocaleDateString()}`,
      description: '',
      author: '',
      tags: '',
      category: 'User Arrangements'
    });
  };

  const confirmSaveVLFile = async () => {
    try {
      // Validate form data
      if (!saveFormData.name.trim()) {
        showToast('Please enter a name for the arrangement', 'error');
        return;
      }

      // Prepare metadata
      const metadata = {
        name: saveFormData.name.trim(),
        description: saveFormData.description.trim(),
        author: saveFormData.author.trim(),
        tags: saveFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        category: saveFormData.category
      };

      // Create VL file data
      const vlFileData = createVLFileData(appState, selectedCopedent, metadata);

      // Save to localStorage
      const result = saveVLFileToStorage(vlFileData);
      
      if (result.success) {
        showToast(result.message, 'success');
        setIsSaveModalOpen(false);
        setSaveFormData({
          name: '',
          description: '',
          author: '',
          tags: '',
          category: 'User Arrangements'
        });
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Error saving VL file: ' + error.message, 'error');
    }
  };

  const handleLoadVLFile = async (vlFileData) => {
    try {
      // Extract state from VL file
      const newState = extractVLState(vlFileData);
      
      // Update app state
      setAppState(prev => ({
        ...prev,
        ...newState
      }));

      // Call parent callback if provided
      if (onLoadVLFile) {
        onLoadVLFile(vlFileData);
      }

      showToast(`Loaded VL arrangement: ${vlFileData.name}`, 'success');
    } catch (error) {
      showToast('Error loading VL file: ' + error.message, 'error');
    }
  };

  const handleExportVLFile = async () => {
    try {
      // Create a quick export with basic metadata
      const metadata = {
        name: `VL Export ${new Date().toLocaleDateString()}`,
        description: 'Exported Voice Leader arrangement',
        author: '',
        tags: ['export'],
        category: 'Exports'
      };

      const vlFileData = createVLFileData(appState, selectedCopedent, metadata);
      const result = exportVLFileToDownload(vlFileData);
      
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Error exporting VL file: ' + error.message, 'error');
    }
  };

  const handleImportVLFile = async () => {
    try {
      const result = await importVLFileFromUpload();
      
      if (result.success) {
        // Confirm import with user
        const confirmImport = window.confirm(
          `Import VL arrangement "${result.data.name}"?\n` +
          `This will replace your current arrangement.`
        );
        
        if (confirmImport) {
          await handleLoadVLFile(result.data);
        }
      }
    } catch (error) {
      showToast('Error importing VL file: ' + error.message, 'error');
    }
  };

  const openLoadModal = () => {
    setModalMode('load');
    setIsVLModalOpen(true);
  };

  const openManageModal = () => {
    setModalMode('manage');
    setIsVLModalOpen(true);
  };

  return (
    <>
      {/* VL File Management Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={openLoadModal}
          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          title="Load VL arrangement from saved files"
        >
          Load VL
        </button>
        
        <button
          onClick={handleSaveVLFile}
          className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          title="Save current arrangement as VL file"
        >
          Save VL
        </button>
        
        <button
          onClick={handleImportVLFile}
          className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
          title="Import VL file from computer"
        >
          Import VL
        </button>
        
        <button
          onClick={handleExportVLFile}
          className="px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
          title="Export current arrangement as VL file"
        >
          Export VL
        </button>
        
        <button
          onClick={openManageModal}
          className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          title="Manage saved VL files"
        >
          Manage VL
        </button>
      </div>

      {/* VL File Modal */}
      <VLFileModal
        isOpen={isVLModalOpen}
        onClose={() => setIsVLModalOpen(false)}
        onLoadVLFile={handleLoadVLFile}
        mode={modalMode}
      />

      {/* Save VL File Modal */}
      {isSaveModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={() => setIsSaveModalOpen(false)}
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Save VL Arrangement</h3>
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={saveFormData.name}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter arrangement name"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={saveFormData.description}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the arrangement"
                    rows={3}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={saveFormData.author}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={saveFormData.category}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getAllCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags <span className="text-gray-500">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={saveFormData.tags}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="jazz, ballad, practice"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSaveVLFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Save Arrangement
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default VLFileManager;