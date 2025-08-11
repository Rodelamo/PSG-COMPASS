// src/components/AppMigrationModal.js

import React, { useState, useRef } from 'react';
import { 
  generateAppExportData, 
  createMigrationFile, 
  validateAndImportAppData,
  generateExportSummary 
} from '../utils/AppMigrationSystem.js';
import { useToast } from '../App.js';
import { generateFileName, getFileAcceptAttribute } from '../utils/FileExtensions.js';

const AppMigrationModal = ({ 
  isOpen, 
  onClose, 
  onExportComplete, 
  onImportComplete 
}) => {
  const showToast = useToast();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportSummary, setExportSummary] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importSummary, setImportSummary] = useState(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      showToast('Gathering app data...', 'info');
      
      // Generate complete export data
      const exportData = await generateAppExportData();
      const summary = generateExportSummary(exportData);
      setExportSummary(summary);
      
      // Create migration file
      const migrationFile = createMigrationFile(exportData);
      
      // Trigger download
      const dataStr = JSON.stringify(migrationFile, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = generateFileName('migration', 'PSG-Compass-Export');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
      
      showToast(`Export complete: ${summary.totalItems} items exported`, 'success');
      onExportComplete && onExportComplete(summary);
      
    } catch (error) {
      console.error('Export failed:', error);
      showToast(`Export failed: ${error.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (file) => {
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const fileData = JSON.parse(e.target.result);
          setImportFile(file);
          setImportSummary({
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + ' KB',
            totalItems: fileData.metadata?.totalItems || 'Unknown',
            dataTypes: fileData.metadata?.dataTypes || {},
            isValid: true
          });
        } catch (error) {
          showToast('Invalid JSON file', 'error');
          setImportFile(null);
          setImportSummary(null);
        }
      };
      reader.readAsText(file);
    } else {
      showToast('Please select a PSG Compass backup file', 'error');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      showToast('Please select a file to import', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileData = JSON.parse(e.target.result);
          
          showToast('Validating migration file...', 'info');
          const importResult = await validateAndImportAppData(fileData);
          
          if (importResult.success) {
            showToast(`Import successful: ${importResult.summary.totalImported} items imported`, 'success');
            onImportComplete && onImportComplete(importResult);
            onClose();
          } else {
            showToast(`Import failed: ${importResult.error}`, 'error');
          }
          
        } catch (parseError) {
          showToast('Invalid migration file format', 'error');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(importFile);
      
    } catch (error) {
      console.error('Import failed:', error);
      showToast(`Import failed: ${error.message}`, 'error');
      setIsImporting(false);
    }
  };


  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            💾 App Migration System
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'export'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📤 Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'import'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📥 Import
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Export Complete App Data</h3>
                <p className="text-gray-600 mb-4">
                  Export ALL your customizations into a single file for backup, device migration, or sharing.
                  This includes copedents, progressions, favorites, and preferences.
                </p>
                
                {exportSummary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Last Export Summary</h4>
                    <div className="text-sm text-blue-800 grid grid-cols-2 gap-2">
                      <div>Total Items: {exportSummary.totalItems}</div>
                      <div>File Size: {(exportSummary.size / 1024).toFixed(1)} KB</div>
                      <div>Copedents: {exportSummary.dataTypes.userCopedents}</div>
                      <div>Progressions: {exportSummary.dataTypes.chordProgressions}</div>
                      <div>VL Files: {exportSummary.dataTypes.voiceLeaderFiles}</div>
                      <div>Favorites: {exportSummary.dataTypes.favoriteChords}</div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Exporting App Data...
                  </div>
                ) : (
                  '📦 Export Complete App Data'
                )}
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Import App Data</h3>
                <p className="text-gray-600 mb-4">
                  Import a migration file to restore or merge app data. 
                  Existing data will be preserved unless there are conflicts.
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                📁 Choose Migration File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={getFileAcceptAttribute('migration')}
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Import Summary */}
              {importSummary && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">File Ready for Import</h4>
                  <div className="text-sm text-green-800 grid grid-cols-2 gap-2">
                    <div>File: {importSummary.fileName}</div>
                    <div>Size: {importSummary.fileSize}</div>
                    <div>Total Items: {importSummary.totalItems}</div>
                    <div>Status: ✅ Valid</div>
                    {importSummary.dataTypes && (
                      <>
                        <div>Copedents: {importSummary.dataTypes.userCopedents || 0}</div>
                        <div>Favorites: {importSummary.dataTypes.favoriteChords || 0}</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Import Button */}
              {importFile && (
                <button
                  onClick={handleImport}
                  disabled={isImporting || !importSummary?.isValid}
                  className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Importing App Data...
                    </div>
                  ) : (
                    '📥 Import App Data'
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Migration files contain ALL your app customizations. Keep them safe for backup purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppMigrationModal;