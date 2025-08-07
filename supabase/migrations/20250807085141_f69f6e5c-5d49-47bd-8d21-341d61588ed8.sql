-- Fix the lab order billing system

-- First, create the trigger to automatically create bills when lab orders are created
CREATE OR REPLACE TRIGGER lab_order_bill_trigger
  AFTER INSERT ON public.lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_lab_order_bill();

-- Clean up duplicate bills for Abacha Mohammed (keeping only one per lab order)
-- Delete the duplicate bills without lab_order_id for this patient
DELETE FROM public.bills 
WHERE patient_id = (SELECT id FROM patients WHERE first_name ILIKE 'Abacha%') 
  AND bill_type = 'lab_test' 
  AND lab_order_id IS NULL 
  AND created_at >= '2025-08-07 08:47:00';

-- Update the bill creation function to properly link lab_order_id
CREATE OR REPLACE FUNCTION public.create_lab_order_bill()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Create a bill for the lab order with proper linking
  INSERT INTO public.bills (
    patient_id,
    amount,
    description,
    created_by,
    hospital_id,
    bill_type,
    lab_order_id
  ) VALUES (
    NEW.patient_id,
    (SELECT price FROM lab_test_types WHERE id = NEW.test_type_id),
    'Lab Test: ' || (SELECT name FROM lab_test_types WHERE id = NEW.test_type_id),
    NEW.ordered_by,
    NEW.hospital_id,
    'lab_test',
    NEW.id
  );
  
  RETURN NEW;
END;
$function$;