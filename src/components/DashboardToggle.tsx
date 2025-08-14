import React from 'react';
import { Clock, LayoutDashboard } from "lucide-react";

interface DashboardToggleProps {
  viewMode: 'outpatients' | 'inpatients' | 'timeline';
  onToggle: (mode: 'outpatients' | 'inpatients' | 'timeline') => void;
}

export const DashboardToggle = ({ viewMode, onToggle }: DashboardToggleProps) => {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="flex items-center bg-muted rounded-full p-1 h-12 min-w-[480px] relative">
        {/* Background slider */}
        <div 
          className={`absolute top-1 bottom-1 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out ${
            viewMode === 'outpatients' 
              ? 'left-1 right-[66.666%]' 
              : viewMode === 'inpatients'
              ? 'left-[33.333%] right-[33.333%]'
              : 'left-[66.666%] right-1'
          }`}
        />
        
        {/* Outpatients option */}
        <button
          onClick={() => onToggle('outpatients')}
          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full transition-colors duration-300 flex-1 relative z-10 ${
            viewMode === 'outpatients' 
              ? 'text-foreground font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-sm font-medium">Outpatients</span>
        </button>
        
        {/* Inpatients option */}
        <button
          onClick={() => onToggle('inpatients')}
          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full transition-colors duration-300 flex-1 relative z-10 ${
            viewMode === 'inpatients' 
              ? 'text-foreground font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-sm font-medium">Inpatients</span>
        </button>
        
        {/* Timeline option */}
        <button
          onClick={() => onToggle('timeline')}
          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full transition-colors duration-300 flex-1 relative z-10 ${
            viewMode === 'timeline' 
              ? 'text-foreground font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Patient Timeline</span>
        </button>
      </div>
    </div>
  );
};