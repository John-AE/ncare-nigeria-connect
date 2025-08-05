-- Create trigger to automatically create bills for lab orders
CREATE TRIGGER create_bill_for_lab_order
    AFTER INSERT ON public.lab_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.create_lab_order_bill();

-- Create bills for existing lab orders that don't have bills
INSERT INTO public.bills (
    patient_id,
    amount,
    description,
    created_by,
    hospital_id,
    bill_type,
    lab_order_id,
    created_at
)
SELECT 
    lo.patient_id,
    COALESCE(ltt.price, 0) as amount,
    'Lab Test: ' || COALESCE(ltt.name, 'Unknown Test') as description,
    lo.ordered_by as created_by,
    lo.hospital_id,
    'lab_test' as bill_type,
    lo.id as lab_order_id,
    lo.created_at
FROM public.lab_orders lo
LEFT JOIN public.lab_test_types ltt ON lo.test_type_id = ltt.id
LEFT JOIN public.bills b ON b.lab_order_id = lo.id
WHERE b.id IS NULL;