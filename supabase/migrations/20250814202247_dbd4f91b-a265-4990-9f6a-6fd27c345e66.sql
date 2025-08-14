-- Create inpatient admissions table
CREATE TABLE public.inpatient_admissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  hospital_id UUID NOT NULL,
  room_number TEXT,
  bed_number TEXT,
  admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discharge_date TIMESTAMP WITH TIME ZONE,
  admission_reason TEXT,
  attending_doctor_id UUID NOT NULL,
  admitting_diagnosis TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inpatient timeline events table
CREATE TABLE public.inpatient_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  hospital_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'vitals', 'medication', 'doctor_note', 'nursing_note', 'procedure'
  event_title TEXT NOT NULL,
  event_data JSONB NOT NULL,
  recorded_by UUID NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inpatient vitals table
CREATE TABLE public.inpatient_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  hospital_id UUID NOT NULL,
  temperature NUMERIC,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  oxygen_saturation NUMERIC,
  pain_scale INTEGER,
  recorded_by UUID NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inpatient medication records table
CREATE TABLE public.inpatient_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  hospital_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  route TEXT NOT NULL,
  administered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  administered_by UUID NOT NULL,
  prescribed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inpatient notes table
CREATE TABLE public.inpatient_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  hospital_id UUID NOT NULL,
  note_type TEXT NOT NULL, -- 'doctor', 'nursing'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inpatient procedures table
CREATE TABLE public.inpatient_procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  hospital_id UUID NOT NULL,
  procedure_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  performed_by UUID NOT NULL,
  assistants TEXT[],
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.inpatient_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inpatient_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inpatient_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inpatient_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inpatient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inpatient_procedures ENABLE ROW LEVEL SECURITY;

-- RLS policies for inpatient_admissions
CREATE POLICY "Medical staff can view admissions in their hospital" 
ON public.inpatient_admissions 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Medical staff can create admissions in their hospital" 
ON public.inpatient_admissions 
FOR INSERT 
WITH CHECK ((auth.uid() = created_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['nurse', 'doctor', 'admin'])
)));

CREATE POLICY "Medical staff can update admissions in their hospital" 
ON public.inpatient_admissions 
FOR UPDATE 
USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['nurse', 'doctor', 'admin'])
)));

-- RLS policies for timeline events
CREATE POLICY "Medical staff can view timeline events in their hospital" 
ON public.inpatient_timeline_events 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Medical staff can create timeline events in their hospital" 
ON public.inpatient_timeline_events 
FOR INSERT 
WITH CHECK ((auth.uid() = recorded_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['nurse', 'doctor', 'admin'])
)));

-- RLS policies for vitals
CREATE POLICY "Medical staff can view vitals in their hospital" 
ON public.inpatient_vitals 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Medical staff can create vitals in their hospital" 
ON public.inpatient_vitals 
FOR INSERT 
WITH CHECK ((auth.uid() = recorded_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['nurse', 'doctor', 'admin'])
)));

-- RLS policies for medications
CREATE POLICY "Medical staff can view medications in their hospital" 
ON public.inpatient_medications 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Medical staff can create medications in their hospital" 
ON public.inpatient_medications 
FOR INSERT 
WITH CHECK ((auth.uid() = administered_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['nurse', 'doctor', 'admin'])
)));

-- RLS policies for notes
CREATE POLICY "Medical staff can view notes in their hospital" 
ON public.inpatient_notes 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Medical staff can create notes in their hospital" 
ON public.inpatient_notes 
FOR INSERT 
WITH CHECK ((auth.uid() = created_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['nurse', 'doctor', 'admin'])
)));

-- RLS policies for procedures
CREATE POLICY "Medical staff can view procedures in their hospital" 
ON public.inpatient_procedures 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Medical staff can create procedures in their hospital" 
ON public.inpatient_procedures 
FOR INSERT 
WITH CHECK ((auth.uid() = performed_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['nurse', 'doctor', 'admin'])
)));

-- Add triggers for updated_at columns
CREATE TRIGGER update_inpatient_admissions_updated_at
BEFORE UPDATE ON public.inpatient_admissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to create timeline event automatically
CREATE OR REPLACE FUNCTION public.create_timeline_event_for_vitals()
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
    'vitals',
    'Vital Signs Recorded',
    jsonb_build_object(
      'temperature', NEW.temperature,
      'blood_pressure', NEW.blood_pressure_systolic || '/' || NEW.blood_pressure_diastolic,
      'heart_rate', NEW.heart_rate,
      'respiratory_rate', NEW.respiratory_rate,
      'oxygen_saturation', NEW.oxygen_saturation,
      'pain_scale', NEW.pain_scale,
      'notes', NEW.notes
    ),
    NEW.recorded_by,
    NEW.recorded_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for automatic timeline event creation
CREATE TRIGGER create_vitals_timeline_event
AFTER INSERT ON public.inpatient_vitals
FOR EACH ROW
EXECUTE FUNCTION public.create_timeline_event_for_vitals();

-- Similar functions and triggers for other tables
CREATE OR REPLACE FUNCTION public.create_timeline_event_for_medication()
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
    'medication',
    NEW.medication_name || ' administered',
    jsonb_build_object(
      'medication_name', NEW.medication_name,
      'dosage', NEW.dosage,
      'route', NEW.route,
      'notes', NEW.notes
    ),
    NEW.administered_by,
    NEW.administered_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_medication_timeline_event
AFTER INSERT ON public.inpatient_medications
FOR EACH ROW
EXECUTE FUNCTION public.create_timeline_event_for_medication();

CREATE OR REPLACE FUNCTION public.create_timeline_event_for_note()
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
    CASE WHEN NEW.note_type = 'doctor' THEN 'doctor_note' ELSE 'nursing_note' END,
    NEW.title,
    jsonb_build_object(
      'content', NEW.content,
      'note_type', NEW.note_type
    ),
    NEW.created_by,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_note_timeline_event
AFTER INSERT ON public.inpatient_notes
FOR EACH ROW
EXECUTE FUNCTION public.create_timeline_event_for_note();

CREATE OR REPLACE FUNCTION public.create_timeline_event_for_procedure()
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
    'procedure',
    NEW.procedure_name,
    jsonb_build_object(
      'start_time', NEW.start_time,
      'end_time', NEW.end_time,
      'outcome', NEW.outcome,
      'notes', NEW.notes,
      'assistants', NEW.assistants
    ),
    NEW.performed_by,
    NEW.start_time
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_procedure_timeline_event
AFTER INSERT ON public.inpatient_procedures
FOR EACH ROW
EXECUTE FUNCTION public.create_timeline_event_for_procedure();