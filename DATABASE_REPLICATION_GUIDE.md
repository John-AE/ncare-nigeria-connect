# NCare Nigeria Hospital Management System - Complete Database Replication Guide

This document contains all the SQL code, edge functions, and configuration needed to replicate the entire backend infrastructure for the NCare Nigeria Hospital Management System.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Schema](#database-schema)
3. [Database Functions](#database-functions)
4. [Row Level Security Policies](#row-level-security-policies)
5. [Triggers](#triggers)
6. [Edge Functions](#edge-functions)
7. [Configuration](#configuration)
8. [Setup Instructions](#setup-instructions)

## Prerequisites

### Supabase Requirements
- Supabase Pro plan (for edge functions and advanced features)
- PostgreSQL database access
- Authentication enabled

### Required Secrets/Environment Variables
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `SUPABASE_DB_URL`: Your database connection string
- `RESEND_API_KEY`: For email functionality (optional)

## Database Schema

### 1. Hospitals Table
```sql
CREATE TABLE public.hospitals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
```

### 2. Profiles Table
```sql
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    hospital_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### 3. Patients Table
```sql
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    blood_group TEXT,
    allergies TEXT,
    medical_history TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    hospital_id UUID,
    registered_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
```

### 4. Appointments Table
```sql
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID,
    scheduled_date DATE NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    hospital_id UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
```

### 5. Visits Table
```sql
CREATE TABLE public.visits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_id UUID NOT NULL,
    visit_date DATE NOT NULL,
    visit_time TIME WITHOUT TIME ZONE NOT NULL,
    complaints TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescriptions TEXT,
    hospital_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
```

### 6. Services Table
```sql
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price NUMERIC NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    hospital_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
```

### 7. Bills Table
```sql
CREATE TABLE public.bills (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    discount_reason TEXT,
    description TEXT,
    bill_type TEXT DEFAULT 'medical_service',
    is_paid BOOLEAN NOT NULL DEFAULT false,
    payment_method TEXT,
    lab_order_id UUID,
    hospital_id UUID,
    created_by UUID NOT NULL,
    paid_by UUID,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
```

### 8. Bill Items Table
```sql
CREATE TABLE public.bill_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL,
    service_id UUID,
    medication_id UUID,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
```

### 9. Payment History Table
```sql
CREATE TABLE public.payment_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL,
    payment_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    notes TEXT,
    hospital_id UUID,
    paid_by UUID NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
```

### 10. Medications Table
```sql
CREATE TABLE public.medications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    generic_name TEXT,
    dosage TEXT NOT NULL,
    form TEXT NOT NULL,
    category TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    hospital_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
```

### 11. Medication Inventory Table
```sql
CREATE TABLE public.medication_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    medication_id UUID NOT NULL,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    total_cost NUMERIC NOT NULL DEFAULT 0,
    supplier TEXT,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reorder_point INTEGER NOT NULL DEFAULT 10,
    hospital_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_inventory ENABLE ROW LEVEL SECURITY;
```

### 12. Medication Dispensing Table
```sql
CREATE TABLE public.medication_dispensing (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    medication_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    visit_id UUID,
    inventory_id UUID NOT NULL,
    quantity_dispensed INTEGER NOT NULL,
    notes TEXT,
    hospital_id UUID,
    dispensed_by UUID NOT NULL,
    dispensed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_dispensing ENABLE ROW LEVEL SECURITY;
```

### 13. Prescriptions Table
```sql
CREATE TABLE public.prescriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL,
    service_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
```

### 14. Lab Test Types Table
```sql
CREATE TABLE public.lab_test_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    category TEXT NOT NULL,
    sample_type TEXT NOT NULL,
    unit TEXT,
    normal_range TEXT,
    description TEXT,
    preparation_instructions TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    turnaround_time_hours INTEGER DEFAULT 24,
    is_active BOOLEAN NOT NULL DEFAULT true,
    hospital_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_test_types ENABLE ROW LEVEL SECURITY;
```

### 15. Lab Orders Table
```sql
CREATE TABLE public.lab_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    test_type_id UUID NOT NULL,
    visit_id UUID,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'ordered',
    priority TEXT NOT NULL DEFAULT 'routine',
    clinical_notes TEXT,
    hospital_id UUID NOT NULL,
    ordered_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
```

### 16. Lab Samples Table
```sql
CREATE TABLE public.lab_samples (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    sample_id TEXT NOT NULL,
    sample_condition TEXT,
    notes TEXT,
    hospital_id UUID NOT NULL,
    collected_by UUID,
    collected_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_samples ENABLE ROW LEVEL SECURITY;
```

### 17. Lab Results Table
```sql
CREATE TABLE public.lab_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    result_value TEXT,
    reference_range TEXT,
    result_status TEXT NOT NULL DEFAULT 'pending',
    is_abnormal BOOLEAN DEFAULT false,
    is_critical BOOLEAN DEFAULT false,
    comments TEXT,
    hospital_id UUID NOT NULL,
    tested_by UUID,
    reviewed_by UUID,
    tested_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
```

### 18. Lab Result Attachments Table
```sql
CREATE TABLE public.lab_result_attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    result_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    hospital_id UUID NOT NULL,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_result_attachments ENABLE ROW LEVEL SECURITY;
```

### 19. Vital Signs Table
```sql
CREATE TABLE public.vital_signs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    body_temperature NUMERIC,
    heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    weight NUMERIC,
    oxygen_saturation NUMERIC,
    complaints TEXT,
    hospital_id UUID,
    recorded_by UUID NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
```

### 20. Email Clicks Table
```sql
CREATE TABLE public.email_clicks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID,
    hospital_id UUID,
    clicked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_clicks ENABLE ROW LEVEL SECURITY;
```

## Database Functions

### 1. Admin Check Function
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;
```

### 2. Get Current User Hospital ID
```sql
CREATE OR REPLACE FUNCTION public.get_current_user_hospital_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;
```

### 3. Payment Status Function
```sql
CREATE OR REPLACE FUNCTION public.get_payment_status(bill_amount NUMERIC, amount_paid NUMERIC)
RETURNS TEXT
LANGUAGE PLPGSQL
AS $$
BEGIN
  IF amount_paid = 0 THEN
    RETURN 'unpaid';
  ELSIF amount_paid >= bill_amount THEN
    RETURN 'fully_paid';
  ELSE
    RETURN 'partially_paid';
  END IF;
END;
$$;
```

### 4. Check Lab Payment Status
```sql
CREATE OR REPLACE FUNCTION public.check_lab_payment_status(order_id UUID)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
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
$$;
```

### 5. Create Lab Order Bill Trigger Function
```sql
CREATE OR REPLACE FUNCTION public.create_lab_order_bill()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
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
$$;
```

### 6. Get Low Stock Medications
```sql
CREATE OR REPLACE FUNCTION public.get_low_stock_medications()
RETURNS TABLE(medication_name TEXT, total_quantity BIGINT, reorder_point INTEGER)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    m.name,
    COALESCE(SUM(mi.quantity_on_hand), 0) as total_quantity,
    MIN(mi.reorder_point) as reorder_point
  FROM medications m
  LEFT JOIN medication_inventory mi ON m.id = mi.medication_id
  WHERE m.hospital_id = get_current_user_hospital_id()
    AND m.is_active = true
  GROUP BY m.id, m.name
  HAVING COALESCE(SUM(mi.quantity_on_hand), 0) <= MIN(mi.reorder_point);
$$;
```

### 7. Update Timestamp Function
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### 8. Handle New User Function
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'nurse')
  );
  RETURN NEW;
END;
$$;
```

## Row Level Security Policies

### Hospitals Table Policies
```sql
-- Admins can manage all hospitals
CREATE POLICY "Admins can manage all hospitals" ON public.hospitals
FOR ALL USING (is_admin());

-- Users can view their hospital
CREATE POLICY "Users can view their hospital" ON public.hospitals
FOR SELECT USING ((id = get_current_user_hospital_id()) OR is_admin());
```

### Profiles Table Policies
```sql
-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Users can view profiles in their hospital
CREATE POLICY "Users can view profiles in their hospital" ON public.profiles
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin() OR (user_id = auth.uid()));

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (is_admin());
```

### Patients Table Policies
```sql
-- Staff can register patients in their hospital
CREATE POLICY "Staff can register patients in their hospital" ON public.patients
FOR INSERT WITH CHECK ((auth.uid() = registered_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['nurse'::text, 'doctor'::text, 'admin'::text])))));

-- Staff can update patients in their hospital
CREATE POLICY "Staff can update patients in their hospital" ON public.patients
FOR UPDATE USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['nurse'::text, 'doctor'::text, 'admin'::text])))));

-- Users can view patients in their hospital
CREATE POLICY "Users can view patients in their hospital" ON public.patients
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Appointments Table Policies
```sql
-- Staff can create appointments in their hospital
CREATE POLICY "Staff can create appointments in their hospital" ON public.appointments
FOR INSERT WITH CHECK ((auth.uid() = created_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['nurse'::text, 'doctor'::text, 'admin'::text])))));

-- Staff can update appointments in their hospital
CREATE POLICY "Staff can update appointments in their hospital" ON public.appointments
FOR UPDATE USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['nurse'::text, 'doctor'::text, 'admin'::text])))));

-- Users can view appointments in their hospital
CREATE POLICY "Users can view appointments in their hospital" ON public.appointments
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Visits Table Policies
```sql
-- Doctors can create visits in their hospital
CREATE POLICY "Doctors can create visits in their hospital" ON public.visits
FOR INSERT WITH CHECK ((auth.uid() = doctor_id) AND (hospital_id IS NOT NULL) AND (hospital_id = (SELECT profiles.hospital_id FROM profiles WHERE (profiles.user_id = auth.uid()) LIMIT 1)) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['doctor'::text, 'admin'::text])))));

-- Doctors can update visits in their hospital
CREATE POLICY "Doctors can update visits in their hospital" ON public.visits
FOR UPDATE USING ((auth.uid() = doctor_id) AND ((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['doctor'::text, 'admin'::text])))));

-- Users can view visits in their hospital
CREATE POLICY "Users can view visits in their hospital" ON public.visits
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Services Table Policies
```sql
-- Doctors and admins can manage services
CREATE POLICY "Doctors and admins can manage services" ON public.services
FOR ALL USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['doctor'::text, 'admin'::text])))));

-- Users can view services in their hospital
CREATE POLICY "Users can view services in their hospital" ON public.services
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Bills Table Policies
```sql
-- Staff can create bills in their hospital
CREATE POLICY "Staff can create bills in their hospital" ON public.bills
FOR INSERT WITH CHECK ((auth.uid() = created_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['nurse'::text, 'doctor'::text, 'finance'::text, 'admin'::text])))));

-- Finance staff can update bills in their hospital
CREATE POLICY "Finance staff can update bills in their hospital" ON public.bills
FOR UPDATE USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::text, 'admin'::text])))));

-- Users can view bills in their hospital
CREATE POLICY "Users can view bills in their hospital" ON public.bills
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Bill Items Table Policies
```sql
-- Staff can create bill items in their hospital
CREATE POLICY "Staff can create bill items in their hospital" ON public.bill_items
FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM bills WHERE (bills.id = bill_items.bill_id) AND (bills.hospital_id = get_current_user_hospital_id()))) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['nurse'::text, 'doctor'::text, 'finance'::text, 'admin'::text])))));

-- Users can view bill items in their hospital
CREATE POLICY "Users can view bill items in their hospital" ON public.bill_items
FOR SELECT USING (EXISTS (SELECT 1 FROM bills WHERE (bills.id = bill_items.bill_id) AND ((bills.hospital_id = get_current_user_hospital_id()) OR is_admin())));
```

### Payment History Table Policies
```sql
-- Finance staff can create payment records
CREATE POLICY "Finance staff can create payment records" ON public.payment_history
FOR INSERT WITH CHECK ((auth.uid() = paid_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::text, 'admin'::text])))));

-- Users can view payment history in their hospital
CREATE POLICY "Users can view payment history in their hospital" ON public.payment_history
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Medications Table Policies
```sql
-- Pharmacy and admin can manage medications
CREATE POLICY "Pharmacy and admin can manage medications" ON public.medications
FOR ALL USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['pharmacy'::text, 'admin'::text])))));

-- Users can view medications in their hospital
CREATE POLICY "Users can view medications in their hospital" ON public.medications
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Medication Inventory Table Policies
```sql
-- Pharmacy and admin can manage inventory
CREATE POLICY "Pharmacy and admin can manage inventory" ON public.medication_inventory
FOR ALL USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['pharmacy'::text, 'admin'::text])))));

-- Users can view inventory in their hospital
CREATE POLICY "Users can view inventory in their hospital" ON public.medication_inventory
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Medication Dispensing Table Policies
```sql
-- Pharmacy can create dispensing records
CREATE POLICY "Pharmacy can create dispensing records" ON public.medication_dispensing
FOR INSERT WITH CHECK ((auth.uid() = dispensed_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['pharmacy'::text, 'admin'::text])))));

-- Users can view dispensing records in their hospital
CREATE POLICY "Users can view dispensing records in their hospital" ON public.medication_dispensing
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Prescriptions Table Policies
```sql
-- Doctors can create prescriptions in their hospital
CREATE POLICY "Doctors can create prescriptions in their hospital" ON public.prescriptions
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM (visits v JOIN profiles p ON ((p.user_id = auth.uid()))) WHERE ((v.id = prescriptions.visit_id) AND (v.doctor_id = auth.uid()) AND (v.hospital_id = get_current_user_hospital_id()) AND (p.role = ANY (ARRAY['doctor'::text, 'admin'::text])))));

-- Users can view prescriptions in their hospital
CREATE POLICY "Users can view prescriptions in their hospital" ON public.prescriptions
FOR SELECT USING (EXISTS (SELECT 1 FROM visits WHERE ((visits.id = prescriptions.visit_id) AND ((visits.hospital_id = get_current_user_hospital_id()) OR is_admin()))));
```

### Lab Test Types Table Policies
```sql
-- Lab staff can manage test types
CREATE POLICY "Lab staff can manage test types" ON public.lab_test_types
FOR ALL USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['laboratory'::text, 'admin'::text, 'doctor'::text])))));

-- Users can view test types in their hospital
CREATE POLICY "Users can view test types in their hospital" ON public.lab_test_types
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Lab Orders Table Policies
```sql
-- Medical staff can create lab orders
CREATE POLICY "Medical staff can create lab orders" ON public.lab_orders
FOR INSERT WITH CHECK ((auth.uid() = ordered_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['doctor'::text, 'nurse'::text, 'admin'::text])))));

-- Lab staff can update orders
CREATE POLICY "Lab staff can update orders" ON public.lab_orders
FOR UPDATE USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['laboratory'::text, 'admin'::text, 'doctor'::text])))));

-- Users can view lab orders in their hospital
CREATE POLICY "Users can view lab orders in their hospital" ON public.lab_orders
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Lab Samples Table Policies
```sql
-- Lab staff can manage samples
CREATE POLICY "Lab staff can manage samples" ON public.lab_samples
FOR ALL USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['laboratory'::text, 'admin'::text])))));

-- Users can view samples in their hospital
CREATE POLICY "Users can view samples in their hospital" ON public.lab_samples
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Lab Results Table Policies
```sql
-- Lab staff can manage results
CREATE POLICY "Lab staff can manage results" ON public.lab_results
FOR ALL USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['laboratory'::text, 'admin'::text])))));

-- Medical staff can view results
CREATE POLICY "Medical staff can view results" ON public.lab_results
FOR SELECT USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['laboratory'::text, 'admin'::text, 'doctor'::text, 'nurse'::text])))));
```

### Lab Result Attachments Table Policies
```sql
-- Lab staff can manage attachments
CREATE POLICY "Lab staff can manage attachments" ON public.lab_result_attachments
FOR ALL USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['laboratory'::text, 'admin'::text])))));

-- Medical staff can view attachments
CREATE POLICY "Medical staff can view attachments" ON public.lab_result_attachments
FOR SELECT USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['laboratory'::text, 'admin'::text, 'doctor'::text, 'nurse'::text])))));
```

### Vital Signs Table Policies
```sql
-- Nurses can record vital signs in their hospital
CREATE POLICY "Nurses can record vital signs in their hospital" ON public.vital_signs
FOR INSERT WITH CHECK ((auth.uid() = recorded_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS (SELECT 1 FROM profiles WHERE (profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['nurse'::text, 'admin'::text])))));

-- Users can view vital signs in their hospital
CREATE POLICY "Users can view vital signs in their hospital" ON public.vital_signs
FOR SELECT USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());
```

### Email Clicks Table Policies
```sql
-- Users can insert email clicks for their hospital
CREATE POLICY "Users can insert email clicks for their hospital" ON public.email_clicks
FOR INSERT WITH CHECK (hospital_id IN (SELECT profiles.hospital_id FROM profiles WHERE (profiles.user_id = auth.uid())));

-- Users can view email clicks for their hospital
CREATE POLICY "Users can view email clicks for their hospital" ON public.email_clicks
FOR SELECT USING (hospital_id IN (SELECT profiles.hospital_id FROM profiles WHERE (profiles.user_id = auth.uid())));
```

## Triggers

### 1. Auto-update timestamps
```sql
-- Create triggers for updating updated_at columns
CREATE TRIGGER update_hospitals_updated_at
    BEFORE UPDATE ON public.hospitals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON public.visits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON public.bills
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON public.medications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_inventory_updated_at
    BEFORE UPDATE ON public.medication_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lab_test_types_updated_at
    BEFORE UPDATE ON public.lab_test_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lab_orders_updated_at
    BEFORE UPDATE ON public.lab_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lab_samples_updated_at
    BEFORE UPDATE ON public.lab_samples
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lab_results_updated_at
    BEFORE UPDATE ON public.lab_results
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vital_signs_updated_at
    BEFORE UPDATE ON public.vital_signs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

### 2. User creation trigger
```sql
-- Trigger to create profile when user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### 3. Lab order billing trigger
```sql
-- Trigger to create bill when lab order is created
CREATE TRIGGER create_lab_order_bill_trigger
    AFTER INSERT ON public.lab_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.create_lab_order_bill();
```

## Edge Functions

### 1. Send Access Request Function
**File: `supabase/functions/send-access-request/index.ts`**
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccessRequestData {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: AccessRequestData = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Processing access request for:", email);

    const emailResponse = await resend.emails.send({
      from: "info@123185.xyz",
      to: ["john@123185.xyz"],
      subject: "NCare Nigeria - New Access Request",
      html: `
        <h2>Access Request</h2>
        <p>Someone whose email is <strong>${email}</strong> is requesting access.</p>
        
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <p>Time: ${new Date().toLocaleTimeString()}</p>
      `,
    });

    console.log("Access request email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Access request submitted successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-access-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
```

### 2. Admin Change Password Function
**File: `supabase/functions/admin-change-password/index.ts`**
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: 'User ID and new password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update password' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-change-password function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### 3. Create Lab User Function
**File: `supabase/functions/create-lab-user/index.ts`**
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create the laboratory user
    const { data: user, error: createUserError } = await supabase.auth.admin.createUser({
      email: 'laboratory@ncarenigeria.com',
      password: 'Lab123456!',
      email_confirm: true,
      user_metadata: {
        role: 'laboratory'
      }
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the first hospital
    const { data: hospitals, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id')
      .limit(1);

    if (hospitalError || !hospitals || hospitals.length === 0) {
      console.error('Error fetching hospital:', hospitalError);
      return new Response(JSON.stringify({ error: 'No hospital found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create profile for the laboratory user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.user!.id,
        username: 'laboratory',
        role: 'laboratory',
        hospital_id: hospitals[0].id
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Laboratory user created successfully',
      user: {
        email: 'laboratory@ncarenigeria.com',
        password: 'Lab123456!',
        role: 'laboratory'
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-lab-user function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### 4. Admin Create Lab User Function
**File: `supabase/functions/admin-create-lab-user/index.ts`**
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create the laboratory user
    const { data: user, error: createUserError } = await supabase.auth.admin.createUser({
      email: 'laboratory@ncarenigeria.com',
      password: 'Lab123456!',
      email_confirm: true,
      user_metadata: {
        role: 'laboratory'
      }
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the first hospital
    const { data: hospitals, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id')
      .limit(1);

    if (hospitalError || !hospitals || hospitals.length === 0) {
      console.error('Error fetching hospital:', hospitalError);
      return new Response(JSON.stringify({ error: 'No hospital found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create profile for the laboratory user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.user!.id,
        username: 'laboratory',
        role: 'laboratory',
        hospital_id: hospitals[0].id
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Laboratory user created successfully',
      user: {
        email: 'laboratory@ncarenigeria.com',
        password: 'Lab123456!',
        role: 'laboratory'
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-create-lab-user function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### 5. Send Bill Email Function
**File: `supabase/functions/send-bill-email/index.ts`**
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BillData {
  recipientEmail: string;
  patientName: string;
  billId: string;
  amount: number;
  services: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  hospitalName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const billData: BillData = await req.json();
    
    const { recipientEmail, patientName, billId, amount, services, hospitalName } = billData;

    if (!recipientEmail || !patientName || !billId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create services HTML
    const servicesHtml = services.map(service => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${service.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${service.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₦${service.unitPrice.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₦${service.totalPrice.toLocaleString()}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Medical Bill - ${hospitalName}</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0;">Patient Information</h3>
          <p><strong>Name:</strong> ${patientName}</p>
          <p><strong>Bill ID:</strong> ${billId}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <h3>Services</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Service</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Unit Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${servicesHtml}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <h3 style="color: #2c3e50;">Total Amount: ₦${amount.toLocaleString()}</h3>
        </div>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; color: #1976d2;">
            <strong>Payment Instructions:</strong> Please visit our hospital to make payment or contact our finance department for payment options.
          </p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="text-align: center; color: #666; font-size: 14px;">
          ${hospitalName}<br>
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "noreply@123185.xyz",
      to: [recipientEmail],
      subject: `Medical Bill - ${hospitalName}`,
      html: emailHtml,
    });

    console.log("Bill email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Bill email sent successfully",
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-bill-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
```

## Configuration

### Supabase Config File
**File: `supabase/config.toml`**
```toml
project_id = "your-project-id-here"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[functions.admin-create-lab-user]
verify_jwt = false
```

## Setup Instructions

### Step 1: Create New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details and create

### Step 2: Configure Authentication
1. Go to Authentication → Settings
2. Disable "Confirm email" for faster testing (optional)
3. Configure any OAuth providers if needed

### Step 3: Run Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste all the table creation scripts above
3. Run each section in order:
   - Tables first
   - Functions second
   - RLS policies third
   - Triggers last

### Step 4: Create Edge Functions
1. Create each edge function directory in `supabase/functions/`
2. Add the `index.ts` file for each function
3. Deploy functions using Supabase CLI: `supabase functions deploy`

### Step 5: Set Environment Variables/Secrets
1. Go to Settings → Edge Functions
2. Add the following secrets:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
   - `SUPABASE_DB_URL`: Your database URL
   - `RESEND_API_KEY`: Your Resend API key (for email functions)

### Step 6: Create Initial Data
1. Create a hospital record:
```sql
INSERT INTO public.hospitals (name, address, phone, email) 
VALUES ('Your Hospital Name', 'Hospital Address', 'Phone Number', 'email@hospital.com');
```

2. Create an admin user through the Authentication UI or using:
```sql
-- This will be handled by the handle_new_user() trigger
-- Just create the user through Supabase Auth UI and update their role
UPDATE public.profiles SET role = 'admin' WHERE user_id = 'user-id-here';
```

### Step 7: Test the System
1. Create test users with different roles
2. Test patient registration
3. Test appointment scheduling
4. Test billing and payment features
5. Test lab orders and results
6. Test medication management

## Migration Notes

### For Firebase Migration
- Convert PostgreSQL functions to Cloud Functions
- Replace RLS policies with Firebase Security Rules
- Use Firestore collections instead of PostgreSQL tables
- Implement authentication using Firebase Auth
- Replace edge functions with Cloud Functions

### For Other Supabase Projects
- Update project_id in config.toml
- Update environment variables/secrets
- Run all SQL scripts in order
- Deploy edge functions
- Test all functionality

## Additional Considerations

### Security
- Ensure all RLS policies are properly configured
- Test permission boundaries thoroughly
- Use service role key only in secure server environments
- Regularly audit user access and permissions

### Performance
- Add indexes on frequently queried columns
- Consider partitioning large tables
- Monitor query performance and optimize as needed
- Use connection pooling for high-traffic applications

### Maintenance
- Regularly backup your database
- Monitor edge function logs
- Update dependencies periodically
- Test all functionality after any schema changes

---

*This guide provides a complete replication blueprint for the NCare Nigeria Hospital Management System backend infrastructure.*