-- Create laboratory test types table
CREATE TABLE public.lab_test_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT NOT NULL,
  normal_range TEXT,
  unit TEXT,
  preparation_instructions TEXT,
  sample_type TEXT NOT NULL,
  turnaround_time_hours INTEGER DEFAULT 24,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, code)
);

-- Create lab orders table
CREATE TABLE public.lab_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  test_type_id UUID NOT NULL,
  visit_id UUID,
  hospital_id UUID NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'ordered',
  priority TEXT NOT NULL DEFAULT 'routine',
  clinical_notes TEXT,
  ordered_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lab samples table
CREATE TABLE public.lab_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  sample_id TEXT NOT NULL,
  collected_by UUID,
  collected_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  sample_condition TEXT,
  notes TEXT,
  hospital_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, sample_id)
);

-- Create lab results table
CREATE TABLE public.lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  result_value TEXT,
  result_status TEXT NOT NULL DEFAULT 'pending',
  reference_range TEXT,
  is_abnormal BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,
  tested_by UUID,
  reviewed_by UUID,
  tested_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  hospital_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lab result attachments table
CREATE TABLE public.lab_result_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  result_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  hospital_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lab_test_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_result_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lab_test_types
CREATE POLICY "Lab staff can manage test types" ON public.lab_test_types
  FOR ALL USING (
    (hospital_id = get_current_user_hospital_id() OR is_admin()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('laboratory', 'admin', 'doctor')
    )
  );

CREATE POLICY "Users can view test types in their hospital" ON public.lab_test_types
  FOR SELECT USING (hospital_id = get_current_user_hospital_id() OR is_admin());

-- Create RLS policies for lab_orders
CREATE POLICY "Medical staff can create lab orders" ON public.lab_orders
  FOR INSERT WITH CHECK (
    auth.uid() = ordered_by AND 
    hospital_id = get_current_user_hospital_id() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('doctor', 'nurse', 'admin')
    )
  );

CREATE POLICY "Lab staff can update orders" ON public.lab_orders
  FOR UPDATE USING (
    (hospital_id = get_current_user_hospital_id() OR is_admin()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('laboratory', 'admin', 'doctor')
    )
  );

CREATE POLICY "Users can view lab orders in their hospital" ON public.lab_orders
  FOR SELECT USING (hospital_id = get_current_user_hospital_id() OR is_admin());

-- Create RLS policies for lab_samples
CREATE POLICY "Lab staff can manage samples" ON public.lab_samples
  FOR ALL USING (
    (hospital_id = get_current_user_hospital_id() OR is_admin()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('laboratory', 'admin')
    )
  );

CREATE POLICY "Users can view samples in their hospital" ON public.lab_samples
  FOR SELECT USING (hospital_id = get_current_user_hospital_id() OR is_admin());

-- Create RLS policies for lab_results
CREATE POLICY "Lab staff can manage results" ON public.lab_results
  FOR ALL USING (
    (hospital_id = get_current_user_hospital_id() OR is_admin()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('laboratory', 'admin')
    )
  );

CREATE POLICY "Medical staff can view results" ON public.lab_results
  FOR SELECT USING (
    (hospital_id = get_current_user_hospital_id() OR is_admin()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('laboratory', 'admin', 'doctor', 'nurse')
    )
  );

-- Create RLS policies for lab_result_attachments
CREATE POLICY "Lab staff can manage attachments" ON public.lab_result_attachments
  FOR ALL USING (
    (hospital_id = get_current_user_hospital_id() OR is_admin()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('laboratory', 'admin')
    )
  );

CREATE POLICY "Medical staff can view attachments" ON public.lab_result_attachments
  FOR SELECT USING (
    (hospital_id = get_current_user_hospital_id() OR is_admin()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('laboratory', 'admin', 'doctor', 'nurse')
    )
  );

-- Create triggers for updated_at columns
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

-- Insert some sample test types for the demo hospital
INSERT INTO public.lab_test_types (hospital_id, name, code, category, normal_range, unit, sample_type, price) VALUES
  ((SELECT id FROM hospitals LIMIT 1), 'Complete Blood Count', 'CBC', 'Hematology', '4.5-11.0', '10³/μL', 'Blood', 25.00),
  ((SELECT id FROM hospitals LIMIT 1), 'Fasting Blood Sugar', 'FBS', 'Chemistry', '70-100', 'mg/dL', 'Blood', 15.00),
  ((SELECT id FROM hospitals LIMIT 1), 'Liver Function Test', 'LFT', 'Chemistry', 'Normal', 'Various', 'Blood', 45.00),
  ((SELECT id FROM hospitals LIMIT 1), 'Urine Analysis', 'UA', 'Urinalysis', 'Normal', 'Various', 'Urine', 20.00),
  ((SELECT id FROM hospitals LIMIT 1), 'Thyroid Function Test', 'TFT', 'Endocrinology', '0.4-4.0', 'mIU/L', 'Blood', 35.00);