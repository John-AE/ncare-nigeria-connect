import React from 'react';
import { Clock, LayoutDashboard } from "lucide-react";

interface DashboardToggleProps {
  viewMode: 'dashboard' | 'timeline';
  onToggle: (mode: 'dashboard' | 'timeline') => void;
}

export const DashboardToggle = ({ viewMode, onToggle }: DashboardToggleProps) => {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="flex items-center bg-muted rounded-full p-1 h-12 min-w-[320px] relative">
        {/* Background slider */}
        <div 
          className={`absolute top-1 bottom-1 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out ${
            viewMode === 'dashboard' 
              ? 'left-1 right-[50%]' 
              : 'left-[50%] right-1'
          }`}
        />
        
        {/* Dashboard option */}
        <button
          onClick={() => onToggle('dashboard')}
          className={`flex items-center justify-center space-x-2 px-6 py-2 rounded-full transition-colors duration-300 flex-1 relative z-10 ${
            viewMode === 'dashboard' 
              ? 'text-foreground font-medium' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-sm font-medium">Dashboard View</span>
        </button>
        
        {/* Timeline option */}
        <button
          onClick={() => onToggle('timeline')}
          className={`flex items-center justify-center space-x-2 px-6 py-2 rounded-full transition-colors duration-300 flex-1 relative z-10 ${
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