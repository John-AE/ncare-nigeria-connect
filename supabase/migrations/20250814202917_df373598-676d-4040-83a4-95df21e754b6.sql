-- Add missing foreign key constraints for inpatient tables

-- Add foreign key constraint for inpatient_admissions.patient_id
ALTER TABLE public.inpatient_admissions 
ADD CONSTRAINT fk_inpatient_admissions_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);

-- Add foreign key constraint for inpatient_admissions.attending_doctor_id
ALTER TABLE public.inpatient_admissions 
ADD CONSTRAINT fk_inpatient_admissions_attending_doctor_id 
FOREIGN KEY (attending_doctor_id) REFERENCES public.profiles(user_id);

-- Add foreign key constraint for inpatient_admissions.created_by
ALTER TABLE public.inpatient_admissions 
ADD CONSTRAINT fk_inpatient_admissions_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);

-- Add foreign key constraint for inpatient_timeline_events.admission_id
ALTER TABLE public.inpatient_timeline_events 
ADD CONSTRAINT fk_inpatient_timeline_events_admission_id 
FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id);

-- Add foreign key constraint for inpatient_timeline_events.patient_id
ALTER TABLE public.inpatient_timeline_events 
ADD CONSTRAINT fk_inpatient_timeline_events_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);

-- Add foreign key constraint for inpatient_timeline_events.recorded_by
ALTER TABLE public.inpatient_timeline_events 
ADD CONSTRAINT fk_inpatient_timeline_events_recorded_by 
FOREIGN KEY (recorded_by) REFERENCES public.profiles(user_id);

-- Add foreign key constraint for inpatient_vitals.admission_id
ALTER TABLE public.inpatient_vitals 
ADD CONSTRAINT fk_inpatient_vitals_admission_id 
FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id);

-- Add foreign key constraint for inpatient_vitals.patient_id
ALTER TABLE public.inpatient_vitals 
ADD CONSTRAINT fk_inpatient_vitals_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);

-- Add foreign key constraint for inpatient_vitals.recorded_by
ALTER TABLE public.inpatient_vitals 
ADD CONSTRAINT fk_inpatient_vitals_recorded_by 
FOREIGN KEY (recorded_by) REFERENCES public.profiles(user_id);

-- Add foreign key constraint for inpatient_medications.admission_id
ALTER TABLE public.inpatient_medications 
ADD CONSTRAINT fk_inpatient_medications_admission_id 
FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id);

-- Add foreign key constraint for inpatient_medications.patient_id
ALTER TABLE public.inpatient_medications 
ADD CONSTRAINT fk_inpatient_medications_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);

-- Add foreign key constraint for inpatient_medications.administered_by
ALTER TABLE public.inpatient_medications 
ADD CONSTRAINT fk_inpatient_medications_administered_by 
FOREIGN KEY (administered_by) REFERENCES public.profiles(user_id);

-- Add foreign key constraint for inpatient_medications.prescribed_by
ALTER TABLE public.inpatient_medications 
ADD CONSTRAINT fk_inpatient_medications_prescribed_by 
FOREIGN KEY (prescribed_by) REFERENCES public.profiles(user_id);

-- Add foreign key constraint for inpatient_notes.admission_id
ALTER TABLE public.inpatient_notes 
ADD CONSTRAINT fk_inpatient_notes_admission_id 
FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id);

-- Add foreign key constraint for inpatient_notes.patient_id
ALTER TABLE public.inpatient_notes 
ADD CONSTRAINT fk_inpatient_notes_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);

-- Add foreign key constraint for inpatient_notes.created_by
ALTER TABLE public.inpatient_notes 
ADD CONSTRAINT fk_inpatient_notes_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);

-- Add foreign key constraint for inpatient_procedures.admission_id
ALTER TABLE public.inpatient_procedures 
ADD CONSTRAINT fk_inpatient_procedures_admission_id 
FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id);

-- Add foreign key constraint for inpatient_procedures.patient_id
ALTER TABLE public.inpatient_procedures 
ADD CONSTRAINT fk_inpatient_procedures_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);

-- Add foreign key constraint for inpatient_procedures.performed_by
ALTER TABLE public.inpatient_procedures 
ADD CONSTRAINT fk_inpatient_procedures_performed_by 
FOREIGN KEY (performed_by) REFERENCES public.profiles(user_id);