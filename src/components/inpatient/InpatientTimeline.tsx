/**
 * Inpatient Timeline Component
 * 
 * Central timeline showing chronological view of all patient events
 * Features color-coded entries, expandable details, and search functionality
 * 
 * @author NCare Nigeria Development Team
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Pill,
  FileText,
  Stethoscope,
  ClipboardList,
  Clock,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface TimelineEvent {
  id: string;
  event_type: string;
  event_title: string;
  event_data: any;
  recorded_by: string;
  recorded_at: string;
  staff_name?: string;
}

interface InpatientTimelineProps {
  admissionId: string;
}

export const InpatientTimeline = ({ admissionId }: InpatientTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch timeline events
  const fetchEvents = async () => {
    try {
      // First, get timeline events
      const { data: eventsData, error } = await supabase
        .from('inpatient_timeline_events')
        .select('*')
        .eq('admission_id', admissionId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      // Then get staff names for each event
      const eventsWithStaffNames = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { data: staffData } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', event.recorded_by)
            .single();

          return {
            ...event,
            staff_name: staffData?.username || 'Staff Member'
          };
        })
      );

      setEvents(eventsWithStaffNames);
      setFilteredEvents(eventsWithStaffNames);
    } catch (error) {
      console.error('Error fetching timeline events:', error);
      toast({
        title: "Error",
        description: "Failed to load timeline events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('timeline-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inpatient_timeline_events',
          filter: `admission_id=eq.${admissionId}`
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [admissionId]);

  // Filter events based on search and type
  useEffect(() => {
    let filtered = events;

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(event => event.event_type === selectedFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.event_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(event.event_data).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedFilter]);

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'vitals':
        return Thermometer;
      case 'medication':
        return Pill;
      case 'doctor_note':
        return FileText;
      case 'nursing_note':
        return ClipboardList;
      case 'procedure':
        return Stethoscope;
      default:
        return FileText;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'vitals':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      case 'medication':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'doctor_note':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case 'nursing_note':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800';
      case 'procedure':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  const getBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'vitals':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'medication':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'doctor_note':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'nursing_note':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
      case 'procedure':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const renderEventData = (eventType: string, eventData: any) => {
    switch (eventType) {
      case 'vitals':
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {eventData.temperature && <div>Temp: {eventData.temperature}°F</div>}
            {eventData.blood_pressure && <div>BP: {eventData.blood_pressure}</div>}
            {eventData.heart_rate && <div>HR: {eventData.heart_rate} bpm</div>}
            {eventData.respiratory_rate && <div>RR: {eventData.respiratory_rate}/min</div>}
            {eventData.oxygen_saturation && <div>O2 Sat: {eventData.oxygen_saturation}%</div>}
            {eventData.pain_scale && <div>Pain: {eventData.pain_scale}/10</div>}
            {eventData.notes && <div className="col-span-2 mt-2 text-muted-foreground">Notes: {eventData.notes}</div>}
          </div>
        );
      case 'medication':
        return (
          <div className="text-sm space-y-1">
            <div className="font-medium">{eventData.medication_name}</div>
            <div>Dosage: {eventData.dosage}</div>
            <div>Route: {eventData.route}</div>
            {eventData.notes && <div className="text-muted-foreground">Notes: {eventData.notes}</div>}
          </div>
        );
      case 'doctor_note':
      case 'nursing_note':
        return (
          <div className="text-sm">
            <div className="whitespace-pre-wrap">{eventData.content}</div>
          </div>
        );
      case 'procedure':
        return (
          <div className="text-sm space-y-1">
            <div>Start: {format(new Date(eventData.start_time), 'MMM dd, yyyy HH:mm')}</div>
            {eventData.end_time && <div>End: {format(new Date(eventData.end_time), 'MMM dd, yyyy HH:mm')}</div>}
            {eventData.outcome && <div>Outcome: {eventData.outcome}</div>}
            {eventData.notes && <div className="text-muted-foreground">Notes: {eventData.notes}</div>}
          </div>
        );
      default:
        return (
          <div className="text-sm">
            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(eventData, null, 2)}</pre>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-border p-4 bg-white dark:bg-slate-800">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search timeline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
          >
            <option value="all">All Events</option>
            <option value="vitals">Vitals</option>
            <option value="medication">Medications</option>
            <option value="doctor_note">Doctor Notes</option>
            <option value="nursing_note">Nursing Notes</option>
            <option value="procedure">Procedures</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery || selectedFilter !== 'all' 
              ? 'No events match your search criteria' 
              : 'No timeline events recorded yet'}
          </div>
        ) : (
          filteredEvents.map((event) => {
            const IconComponent = getEventIcon(event.event_type);
            const isExpanded = expandedEvents.has(event.id);
            
            return (
              <Card 
                key={event.id} 
                className={`transition-all duration-200 hover:shadow-md ${getEventColor(event.event_type)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-full ${getBadgeColor(event.event_type)}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-foreground">{event.event_title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {event.event_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEventExpansion(event.id)}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(event.recorded_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {event.staff_name}
                        </span>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border">
                          {renderEventData(event.event_type, event.event_data)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
