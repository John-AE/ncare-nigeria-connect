/**
 * Inpatient Vitals Panel Component
 * 
 * Right sidebar showing current vital signs and key metrics
 * Updates in real-time as new vitals are recorded
 * 
 * @author NCare Nigeria Development Team
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer,
  Heart,
  Activity,
  Droplets,
  Gauge,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface LatestVitals {
  id: string;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  pain_scale?: number;
  recorded_at: string;
  recorded_by: string;
  staff_name?: string;
}

interface InpatientVitalsPanelProps {
  admissionId: string;
}

export const InpatientVitalsPanel = ({ admissionId }: InpatientVitalsPanelProps) => {
  const [latestVitals, setLatestVitals] = useState<LatestVitals | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLatestVitals = async () => {
    try {
      // First, get the latest vitals
      const { data: vitalsData, error: vitalsError } = await supabase
        .from('inpatient_vitals')
        .select('*')
        .eq('admission_id', admissionId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (vitalsError && vitalsError.code !== 'PGRST116') {
        throw vitalsError;
      }

      if (vitalsData) {
        // Get staff name separately
        const { data: staffData } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', vitalsData.recorded_by)
          .single();

        setLatestVitals({
          ...vitalsData,
          staff_name: staffData?.username || 'Staff Member'
        });
      } else {
        setLatestVitals(null);
      }
    } catch (error) {
      console.error('Error fetching latest vitals:', error);
      toast({
        title: "Error",
        description: "Failed to load vital signs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchLatestVitals();

    const channel = supabase
      .channel('vitals-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inpatient_vitals',
          filter: `admission_id=eq.${admissionId}`
        },
        () => {
          fetchLatestVitals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [admissionId]);

  const getVitalStatus = (value: number | undefined, type: string) => {
    if (!value) return 'normal';
    
    switch (type) {
      case 'temperature':
        if (value < 36.1 || value > 37.2) return 'abnormal';
        break;
      case 'systolic_bp':
        if (value < 90 || value > 140) return 'abnormal';
        break;
      case 'diastolic_bp':
        if (value < 60 || value > 90) return 'abnormal';
        break;
      case 'heart_rate':
        if (value < 60 || value > 100) return 'abnormal';
        break;
      case 'oxygen_saturation':
        if (value < 95) return 'critical';
        if (value < 98) return 'abnormal';
        break;
      case 'pain_scale':
        if (value >= 7) return 'critical';
        if (value >= 4) return 'abnormal';
        break;
    }
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'abnormal':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case 'abnormal':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Abnormal</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Normal</Badge>;
    }
  };

  const VitalCard = ({ 
    icon: Icon, 
    label, 
    value, 
    unit, 
    status 
  }: { 
    icon: any, 
    label: string, 
    value: number | string | undefined, 
    unit: string, 
    status: string 
  }) => (
    <div className="flex items-center justify-between p-2 border border-border rounded-lg bg-card">
      <div className="flex items-center space-x-2">
        <Icon className={`h-3 w-3 ${getStatusColor(status)}`} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className={`text-sm font-bold ${getStatusColor(status)}`}>
          {value || 'N/A'} {value && <span className="text-xs">{unit}</span>}
        </span>
        {status !== 'normal' && (
          <AlertTriangle className={`h-3 w-3 ${getStatusColor(status)}`} />
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-64 bg-white dark:bg-slate-800 border-l border-border p-3">
        <div className="text-center text-muted-foreground">Loading vitals...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-l border-border">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center">
          <Activity className="h-3 w-3 mr-1" />
          Current Vitals
        </h3>
        {latestVitals ? (
          <div className="text-xs text-muted-foreground mt-1 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {format(new Date(latestVitals.recorded_at), 'MMM dd, HH:mm')}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground mt-1">No vitals recorded</div>
        )}
      </div>

      <div className="p-3 space-y-2">
        {latestVitals ? (
          <>
            <VitalCard
              icon={Thermometer}
              label="Temperature"
              value={latestVitals.temperature}
              unit="°C"
              status={getVitalStatus(latestVitals.temperature, 'temperature')}
            />

            <VitalCard
              icon={Heart}
              label="Blood Pressure"
              value={
                latestVitals.blood_pressure_systolic && latestVitals.blood_pressure_diastolic
                  ? `${latestVitals.blood_pressure_systolic}/${latestVitals.blood_pressure_diastolic}`
                  : undefined
              }
              unit="mmHg"
              status={Math.max(
                getVitalStatus(latestVitals.blood_pressure_systolic, 'systolic_bp') === 'abnormal' ? 1 : 0,
                getVitalStatus(latestVitals.blood_pressure_diastolic, 'diastolic_bp') === 'abnormal' ? 1 : 0
              ) ? 'abnormal' : 'normal'}
            />

            <VitalCard
              icon={Heart}
              label="Heart Rate"
              value={latestVitals.heart_rate}
              unit="bpm"
              status={getVitalStatus(latestVitals.heart_rate, 'heart_rate')}
            />

            <VitalCard
              icon={Droplets}
              label="O2 Saturation"
              value={latestVitals.oxygen_saturation}
              unit="%"
              status={getVitalStatus(latestVitals.oxygen_saturation, 'oxygen_saturation')}
            />

            <VitalCard
              icon={Gauge}
              label="Pain Scale"
              value={latestVitals.pain_scale}
              unit="/10"
              status={getVitalStatus(latestVitals.pain_scale, 'pain_scale')}
            />

            {/* Overall Status */}
            <div className="mt-3 p-2 border border-border rounded-lg bg-card">
              <div className="text-center">
                <div className="text-xs font-medium text-muted-foreground mb-1">Overall Status</div>
                {(() => {
                  const criticalVitals = [
                    getVitalStatus(latestVitals.temperature, 'temperature'),
                    getVitalStatus(latestVitals.blood_pressure_systolic, 'systolic_bp'),
                    getVitalStatus(latestVitals.blood_pressure_diastolic, 'diastolic_bp'),
                    getVitalStatus(latestVitals.heart_rate, 'heart_rate'),
                    getVitalStatus(latestVitals.oxygen_saturation, 'oxygen_saturation'),
                    getVitalStatus(latestVitals.pain_scale, 'pain_scale')
                  ];

                  if (criticalVitals.includes('critical')) {
                    return getStatusBadge('critical');
                  } else if (criticalVitals.includes('abnormal')) {
                    return getStatusBadge('abnormal');
                  } else {
                    return getStatusBadge('normal');
                  }
                })()}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-6">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-xs">No vital signs recorded</div>
            <div className="text-xs">Use Vital Signs button to record</div>
          </div>
        )}
      </div>
    </div>
  );
};
