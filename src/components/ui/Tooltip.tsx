'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  className?: string;
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  trigger = 'hover',
  className = '' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  const toggleTooltip = () => setIsVisible(!isVisible);

  // Handle escape key to close tooltip
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible]);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800'
  };

  const triggerProps = trigger === 'hover' 
    ? { onMouseEnter: showTooltip, onMouseLeave: hideTooltip }
    : { onClick: toggleTooltip };

  return (
    <div className={`relative inline-block ${className}`}>
      <div {...triggerProps} className="cursor-help">
        {children || <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />}
      </div>
      
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 max-w-xs shadow-xl border border-gray-700">
            {content}
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position].replace('border-t-gray-800', 'border-t-gray-900').replace('border-b-gray-800', 'border-b-gray-900').replace('border-l-gray-800', 'border-l-gray-900').replace('border-r-gray-800', 'border-r-gray-900')}`} />
          </div>
        </div>
      )}
    </div>
  );
}

interface HelpTextProps {
  text: string;
  className?: string;
}

export function HelpText({ text, className = '' }: HelpTextProps) {
  return (
    <Tooltip content={text} className={className}>
      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
    </Tooltip>
  );
}