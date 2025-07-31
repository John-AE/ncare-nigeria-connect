-- Add some sample lab orders and results for demo
DO $$
DECLARE
    sample_hospital_id UUID;
    sample_patient_id UUID;
    sample_doctor_id UUID;
    lab_user_id UUID;
    test_type_id UUID;
    order_id UUID;
BEGIN
    -- Get hospital and user IDs
    SELECT id INTO sample_hospital_id FROM hospitals LIMIT 1;
    SELECT id INTO sample_patient_id FROM patients LIMIT 1;
    SELECT user_id INTO sample_doctor_id FROM profiles WHERE role = 'doctor' LIMIT 1;
    SELECT user_id INTO lab_user_id FROM profiles WHERE role = 'laboratory' LIMIT 1;
    SELECT id INTO test_type_id FROM lab_test_types WHERE code = 'CBC' LIMIT 1;

    -- Create sample lab orders
    INSERT INTO lab_orders (patient_id, doctor_id, test_type_id, hospital_id, status, priority, clinical_notes, ordered_by)
    VALUES 
        (sample_patient_id, sample_doctor_id, test_type_id, sample_hospital_id, 'ordered', 'routine', 'Routine checkup', sample_doctor_id),
        (sample_patient_id, sample_doctor_id, (SELECT id FROM lab_test_types WHERE code = 'FBS'), sample_hospital_id, 'sample_collected', 'urgent', 'Diabetes monitoring', sample_doctor_id),
        (sample_patient_id, sample_doctor_id, (SELECT id FROM lab_test_types WHERE code = 'LFT'), sample_hospital_id, 'in_progress', 'routine', NULL, sample_doctor_id);

    -- Get first order ID for results
    SELECT id INTO order_id FROM lab_orders WHERE status = 'in_progress' LIMIT 1;

    -- Create sample results
    IF order_id IS NOT NULL AND lab_user_id IS NOT NULL THEN
        INSERT INTO lab_results (order_id, result_value, result_status, reference_range, is_abnormal, is_critical, tested_by, reviewed_by, tested_at, reviewed_at, hospital_id)
        VALUES 
            (order_id, '95 mg/dL', 'completed', '70-100 mg/dL', false, false, lab_user_id, lab_user_id, now() - interval '2 hours', now() - interval '1 hour', sample_hospital_id);
    END IF;

    -- Create completed orders for revenue calculation
    INSERT INTO lab_orders (patient_id, doctor_id, test_type_id, hospital_id, status, priority, ordered_by, created_at)
    VALUES 
        (sample_patient_id, sample_doctor_id, (SELECT id FROM lab_test_types WHERE code = 'UA'), sample_hospital_id, 'completed', 'routine', sample_doctor_id, now() - interval '3 days'),
        (sample_patient_id, sample_doctor_id, (SELECT id FROM lab_test_types WHERE code = 'TFT'), sample_hospital_id, 'completed', 'routine', sample_doctor_id, now() - interval '5 days');

END $$;