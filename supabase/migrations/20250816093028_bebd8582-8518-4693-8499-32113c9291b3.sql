-- Add only the missing foreign key relationships
ALTER TABLE public.inpatient_services 
ADD CONSTRAINT fk_inpatient_services_service_id 
FOREIGN KEY (service_id) REFERENCES public.services(id);

ALTER TABLE public.inpatient_services 
ADD CONSTRAINT fk_inpatient_services_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);

ALTER TABLE public.inpatient_services 
ADD CONSTRAINT fk_inpatient_services_admission_id 
FOREIGN KEY (admission_id) REFERENCES public.inpatient_admissions(id);