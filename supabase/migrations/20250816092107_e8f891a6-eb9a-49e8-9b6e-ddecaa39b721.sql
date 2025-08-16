-- Create inpatient_services table for tracking services provided to inpatients
CREATE TABLE public.inpatient_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  hospital_id UUID NOT NULL,
  service_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  administered_by UUID NOT NULL,
  administered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add discharge fields to inpatient_admissions table
ALTER TABLE public.inpatient_admissions 
ADD COLUMN discharge_summary TEXT,
ADD COLUMN discharge_diagnosis TEXT,
ADD COLUMN billing_acknowledged BOOLEAN DEFAULT false;

-- Enable RLS on inpatient_services
ALTER TABLE public.inpatient_services ENABLE ROW LEVEL SECURITY;

-- Create policies for inpatient_services
CREATE POLICY "Medical staff can create services in their hospital" 
ON public.inpatient_services 
FOR INSERT 
WITH CHECK (
  auth.uid() = administered_by 
  AND hospital_id = get_current_user_hospital_id() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('nurse', 'doctor', 'admin')
  )
);

CREATE POLICY "Medical staff can view services in their hospital" 
ON public.inpatient_services 
FOR SELECT 
USING (hospital_id = get_current_user_hospital_id() OR is_admin());

-- Create trigger function for inpatient services timeline events
CREATE OR REPLACE FUNCTION public.create_timeline_event_for_service()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.inpatient_timeline_events (
    admission_id,
    patient_id,
    hospital_id,
    event_type,
    event_title,
    event_data,
    recorded_by,
    recorded_at
  ) VALUES (
    NEW.admission_id,
    NEW.patient_id,
    NEW.hospital_id,
    'service',
    (SELECT name FROM services WHERE id = NEW.service_id),
    jsonb_build_object(
      'service_name', (SELECT name FROM services WHERE id = NEW.service_id),
      'quantity', NEW.quantity,
      'unit_price', NEW.unit_price,
      'total_price', NEW.total_price,
      'notes', NEW.notes
    ),
    NEW.administered_by,
    NEW.administered_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for inpatient services
CREATE TRIGGER create_timeline_event_for_service_trigger
  AFTER INSERT ON public.inpatient_services
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event_for_service();