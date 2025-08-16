-- Add foreign key relationships that were missing
ALTER TABLE public.inpatient_services 
ADD CONSTRAINT fk_inpatient_services_service_id 
FOREIGN KEY (service_id) REFERENCES public.services(id);

ALTER TABLE public.inpatient_services 
ADD CONSTRAINT fk_inpatient_services_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);

ALTER TABLE public.inpatient_services 
ADD CONSTRAINT fk_inpatient_services_admission_id 
FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id);

-- Also add missing foreign keys for other inpatient tables for consistency
ALTER TABLE public.inpatient_medications 
ADD CONSTRAINT fk_inpatient_medications_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.inpatient_medications 
ADD CONSTRAINT fk_inpatient_medications_admission_id 
FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE;

ALTER TABLE public.inpatient_vitals 
ADD CONSTRAINT fk_inpatient_vitals_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.inpatient_vitals 
ADD CONSTRAINT fk_inpatient_vitals_admission_id 
FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id) ON DELETE CASCADE;