-- Create bills for lab orders automatically and require payment before testing
CREATE OR REPLACE FUNCTION public.create_lab_order_bill()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a bill for the lab order
  INSERT INTO public.bills (
    patient_id,
    amount,
    description,
    created_by,
    hospital_id,
    bill_type
  ) VALUES (
    NEW.patient_id,
    (SELECT price FROM lab_test_types WHERE id = NEW.test_type_id),
    'Lab Test: ' || (SELECT name FROM lab_test_types WHERE id = NEW.test_type_id),
    NEW.ordered_by,
    NEW.hospital_id,
    'lab_test'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create bills for lab orders
CREATE TRIGGER create_lab_bill_trigger
  AFTER INSERT ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_lab_order_bill();

-- Add bill_type column to bills table if it doesn't exist
ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_type TEXT DEFAULT 'medical_service';

-- Add lab_order_id to bills table to link bills to lab orders
ALTER TABLE bills ADD COLUMN IF NOT EXISTS lab_order_id UUID REFERENCES lab_orders(id);

-- Function to check if lab order payment is made before allowing result entry
CREATE OR REPLACE FUNCTION public.check_lab_payment_status(order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  payment_status TEXT;
BEGIN
  SELECT 
    CASE 
      WHEN amount_paid >= amount THEN 'paid'
      ELSE 'unpaid'
    END
  INTO payment_status
  FROM bills 
  WHERE lab_order_id = order_id;
  
  RETURN payment_status = 'paid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;