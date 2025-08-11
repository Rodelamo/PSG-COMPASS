// src/components/Toast.js

// FIX: Import 'useCallback' to wrap the handleClose function.
import React, { useState, useEffect, useCallback } from 'react';

/**
 * Toast Component
 * * Displays a small, non-blocking notification message that automatically
 * disappears after a few seconds.
 * * @param {Object} props - Component props.
 * @param {string} props.message - The message to display in the toast.
 * @param {string} [props.type='success'] - The type of toast ('success', 'error'), which determines its color.
 * @param {function} props.onClose - A function to call to dismiss the toast.
 */
function Toast({ message, type = 'success', onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  // FIX: Wrap the handleClose function in useCallback.
  // This ensures the function identity is stable across re-renders
  // and can be safely used as a dependency in the useEffect hook below.
  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Wait for the fade-out animation to complete before calling the parent's onClose.
    setTimeout(() => {
      onClose();
    }, 300); // This duration should match the CSS transition duration.
  }, [onClose]);


  // When the component mounts, trigger the fade-in animation.
  useEffect(() => {
    setIsVisible(true);

    // Set a timer to automatically close the toast after 4 seconds.
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);

    // Clean up the timer if the component unmounts early.
    return () => clearTimeout(timer);
    
  // FIX: Add 'handleClose' to the dependency array.
  // This resolves the react-hooks/exhaustive-deps warning by telling React
  // that this effect depends on the handleClose function.
  }, [handleClose]);


  // Determine the background and text color based on the toast type.
  const baseClasses = "fixed top-5 right-5 z-[100] max-w-sm p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out";
  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  const animationClasses = isVisible ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-12';

  return (
    <div className={`${baseClasses} ${typeClasses[type] || typeClasses.info} ${animationClasses}`}>
      <div className="flex items-center justify-between">
        <p className="font-medium">{message}</p>
        <button onClick={handleClose} className="ml-4 text-xl font-semibold leading-none hover:opacity-75">&times;</button>
      </div>
    </div>
  );
}

export default Toast;