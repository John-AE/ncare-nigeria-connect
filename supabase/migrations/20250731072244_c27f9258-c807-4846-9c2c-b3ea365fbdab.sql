-- Add foreign key constraints for better TypeScript support
ALTER TABLE public.lab_orders 
ADD CONSTRAINT fk_lab_orders_patient_id 
FOREIGN KEY (patient_id) REFERENCES public.patients(id);

ALTER TABLE public.lab_orders 
ADD CONSTRAINT fk_lab_orders_doctor_id 
FOREIGN KEY (doctor_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.lab_orders 
ADD CONSTRAINT fk_lab_orders_test_type_id 
FOREIGN KEY (test_type_id) REFERENCES public.lab_test_types(id);

ALTER TABLE public.lab_orders 
ADD CONSTRAINT fk_lab_orders_hospital_id 
FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id);

ALTER TABLE public.lab_samples 
ADD CONSTRAINT fk_lab_samples_order_id 
FOREIGN KEY (order_id) REFERENCES public.lab_orders(id);

ALTER TABLE public.lab_results 
ADD CONSTRAINT fk_lab_results_order_id 
FOREIGN KEY (order_id) REFERENCES public.lab_orders(id);

ALTER TABLE public.lab_result_attachments 
ADD CONSTRAINT fk_lab_attachments_result_id 
FOREIGN KEY (result_id) REFERENCES public.lab_results(id);

-- Add missing description column to lab_test_types if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lab_test_types' AND column_name='description') THEN
        ALTER TABLE public.lab_test_types ADD COLUMN description TEXT;
    END IF;
END $$;