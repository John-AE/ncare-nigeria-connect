-- Create missing bill for the latest lab order
INSERT INTO public.bills (
  patient_id,
  amount,
  description,
  created_by,
  hospital_id,
  bill_type,
  lab_order_id
) 
SELECT 
  lo.patient_id,
  lt.price,
  'Lab Test: ' || lt.name,
  lo.ordered_by,
  lo.hospital_id,
  'lab_test',
  lo.id
FROM lab_orders lo
JOIN lab_test_types lt ON lo.test_type_id = lt.id
WHERE lo.id = '53e839fe-7f11-499a-af40-66015ce4ec0d'
  AND NOT EXISTS (
    SELECT 1 FROM bills 
    WHERE lab_order_id = lo.id
  );