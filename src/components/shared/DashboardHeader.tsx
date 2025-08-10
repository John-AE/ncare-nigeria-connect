/**
 * Dashboard Header Component
 * 
 * Reusable header component for all dashboard pages.
 * Provides consistent styling and functionality across dashboards.
 * 
 * @author NCare Nigeria Development Team
 */

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  children?: React.ReactNode;
}

/**
 * Standard dashboard header with title, subtitle, and refresh button
 */
export const DashboardHeader = ({ 
  title, 
  subtitle, 
  onRefresh, 
  children 
}: DashboardHeaderProps) => {
  return (
    <div className="border-b border-border pb-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {children}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};