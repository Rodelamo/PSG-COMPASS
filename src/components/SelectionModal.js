// src/components/SelectionModal.js

import React, { useState } from 'react';

function SelectionModal({ title, categories, selectedValue, onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(categories[0].name);

  const handleSelect = (itemName) => {
    onSelect(itemName);
    onClose();
  };

  const items = categories.find(c => c.name === activeCategory)?.items || [];

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold p-4 border-b text-center text-gray-800">{title}</h2>
        <div className="flex flex-grow overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 md:w-1/4 bg-gray-50 border-r overflow-y-auto">
            {categories.map(category => (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`w-full text-left p-3 text-sm font-semibold transition-colors ${activeCategory === category.name ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                {category.name}
              </button>
            ))}
          </div>
          {/* Main Content */}
          <div className="w-2/3 md:w-3/4 overflow-y-auto">
            {items.map(item => (
              <button
                key={item.name}
                onClick={() => handleSelect(item.name)}
                className={`w-full text-left p-3 transition-colors ${selectedValue === item.name ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-gray-100'}`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 text-right">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Close</button>
        </div>
      </div>
    </div>
  );
}

export default SelectionModal;