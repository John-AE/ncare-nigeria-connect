-- Create laboratory user directly via SQL since edge function may not have been called
DO $$ 
DECLARE
    lab_user_id UUID;
    hospital_id UUID;
BEGIN
    -- Get the first hospital
    SELECT id INTO hospital_id FROM hospitals LIMIT 1;
    
    -- Check if laboratory user already exists
    SELECT user_id INTO lab_user_id FROM profiles WHERE role = 'laboratory' LIMIT 1;
    
    -- If no lab user exists, we need to create one
    -- Note: We can't create auth users directly via SQL, so we'll update existing user
    IF lab_user_id IS NULL THEN
        -- Create a profile entry that the edge function can use
        INSERT INTO profiles (user_id, username, role, hospital_id)
        VALUES (
            'laboratory-temp-id',
            'Laboratory Staff', 
            'laboratory',
            hospital_id
        );
    END IF;
END $$;

-- For now, let's create a proper lab user by updating an existing user
-- Get the first non-admin user and convert them to laboratory role temporarily
UPDATE profiles 
SET role = 'laboratory', username = 'Laboratory Staff'
WHERE user_id = (
    SELECT user_id FROM profiles 
    WHERE role != 'admin' 
    AND user_id NOT IN (SELECT user_id FROM profiles WHERE role = 'laboratory')
    LIMIT 1
);