/**
 * Dashboard Header Component
 * 
 * Reusable header component for all dashboard pages.
 * Provides consistent styling and functionality across dashboards.
 * 
 * @author NCare Nigeria Development Team
 */

import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

/**
 * Standard dashboard header with title and subtitle
 */
export const DashboardHeader = ({ 
  title, 
  subtitle, 
  children 
}: DashboardHeaderProps) => {
  return (
    <div className="border-b border-border pb-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};