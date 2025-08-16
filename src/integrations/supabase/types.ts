export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          created_by: string
          doctor_id: string | null
          end_time: string
          hospital_id: string | null
          id: string
          notes: string | null
          patient_id: string
          scheduled_date: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          doctor_id?: string | null
          end_time: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_date: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          doctor_id?: string | null
          end_time?: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_date?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_items: {
        Row: {
          bill_id: string
          created_at: string
          id: string
          medication_id: string | null
          quantity: number
          service_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          bill_id: string
          created_at?: string
          id?: string
          medication_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          bill_id?: string
          created_at?: string
          id?: string
          medication_id?: string | null
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount: number
          amount_paid: number
          bill_type: string | null
          created_at: string
          created_by: string
          description: string | null
          discount_amount: number | null
          discount_reason: string | null
          hospital_id: string | null
          id: string
          is_paid: boolean
          lab_order_id: string | null
          paid_at: string | null
          paid_by: string | null
          patient_id: string
          payment_method: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          bill_type?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          discount_amount?: number | null
          discount_reason?: string | null
          hospital_id?: string | null
          id?: string
          is_paid?: boolean
          lab_order_id?: string | null
          paid_at?: string | null
          paid_by?: string | null
          patient_id: string
          payment_method?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          bill_type?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          discount_amount?: number | null
          discount_reason?: string | null
          hospital_id?: string | null
          id?: string
          is_paid?: boolean
          lab_order_id?: string | null
          paid_at?: string | null
          paid_by?: string | null
          patient_id?: string
          payment_method?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_clicks: {
        Row: {
          bill_id: string | null
          clicked_at: string | null
          hospital_id: string | null
          id: string
        }
        Insert: {
          bill_id?: string | null
          clicked_at?: string | null
          hospital_id?: string | null
          id?: string
        }
        Update: {
          bill_id?: string | null
          clicked_at?: string | null
          hospital_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_clicks_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_clicks_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inpatient_admissions: {
        Row: {
          admission_date: string
          admission_reason: string | null
          admitting_diagnosis: string | null
          attending_doctor_id: string
          bed_number: string | null
          billing_acknowledged: boolean | null
          created_at: string
          created_by: string
          discharge_date: string | null
          discharge_diagnosis: string | null
          discharge_summary: string | null
          hospital_id: string
          id: string
          patient_id: string
          room_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admission_date?: string
          admission_reason?: string | null
          admitting_diagnosis?: string | null
          attending_doctor_id: string
          bed_number?: string | null
          billing_acknowledged?: boolean | null
          created_at?: string
          created_by: string
          discharge_date?: string | null
          discharge_diagnosis?: string | null
          discharge_summary?: string | null
          hospital_id: string
          id?: string
          patient_id: string
          room_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admission_date?: string
          admission_reason?: string | null
          admitting_diagnosis?: string | null
          attending_doctor_id?: string
          bed_number?: string | null
          billing_acknowledged?: boolean | null
          created_at?: string
          created_by?: string
          discharge_date?: string | null
          discharge_diagnosis?: string | null
          discharge_summary?: string | null
          hospital_id?: string
          id?: string
          patient_id?: string
          room_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inpatient_admissions_attending_doctor_id"
            columns: ["attending_doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_inpatient_admissions_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_inpatient_admissions_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      inpatient_medications: {
        Row: {
          administered_at: string
          administered_by: string
          admission_id: string
          created_at: string
          dosage: string
          hospital_id: string
          id: string
          medication_name: string
          notes: string | null
          patient_id: string
          prescribed_by: string | null
          route: string
        }
        Insert: {
          administered_at: string
          administered_by: string
          admission_id: string
          created_at?: string
          dosage: string
          hospital_id: string
          id?: string
          medication_name: string
          notes?: string | null
          patient_id: string
          prescribed_by?: string | null
          route: string
        }
        Update: {
          administered_at?: string
          administered_by?: string
          admission_id?: string
          created_at?: string
          dosage?: string
          hospital_id?: string
          id?: string
          medication_name?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string | null
          route?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inpatient_medications_administered_by"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_inpatient_medications_admission_id"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "inpatient_admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inpatient_medications_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inpatient_medications_prescribed_by"
            columns: ["prescribed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inpatient_notes: {
        Row: {
          admission_id: string
          content: string
          created_at: string
          created_by: string
          hospital_id: string
          id: string
          note_type: string
          patient_id: string
          title: string
        }
        Insert: {
          admission_id: string
          content: string
          created_at?: string
          created_by: string
          hospital_id: string
          id?: string
          note_type: string
          patient_id: string
          title: string
        }
        Update: {
          admission_id?: string
          content?: string
          created_at?: string
          created_by?: string
          hospital_id?: string
          id?: string
          note_type?: string
          patient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inpatient_notes_admission_id"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "inpatient_admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inpatient_notes_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_inpatient_notes_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      inpatient_procedures: {
        Row: {
          admission_id: string
          assistants: string[] | null
          created_at: string
          end_time: string | null
          hospital_id: string
          id: string
          notes: string | null
          outcome: string | null
          patient_id: string
          performed_by: string
          procedure_name: string
          start_time: string
        }
        Insert: {
          admission_id: string
          assistants?: string[] | null
          created_at?: string
          end_time?: string | null
          hospital_id: string
          id?: string
          notes?: string | null
          outcome?: string | null
          patient_id: string
          performed_by: string
          procedure_name: string
          start_time: string
        }
        Update: {
          admission_id?: string
          assistants?: string[] | null
          created_at?: string
          end_time?: string | null
          hospital_id?: string
          id?: string
          notes?: string | null
          outcome?: string | null
          patient_id?: string
          performed_by?: string
          procedure_name?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inpatient_procedures_admission_id"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "inpatient_admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inpatient_procedures_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inpatient_procedures_performed_by"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inpatient_services: {
        Row: {
          administered_at: string
          administered_by: string
          admission_id: string
          created_at: string
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          quantity: number
          service_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          administered_at?: string
          administered_by: string
          admission_id: string
          created_at?: string
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          quantity?: number
          service_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          administered_at?: string
          administered_by?: string
          admission_id?: string
          created_at?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          quantity?: number
          service_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: []
      }
      inpatient_timeline_events: {
        Row: {
          admission_id: string
          created_at: string
          event_data: Json
          event_title: string
          event_type: string
          hospital_id: string
          id: string
          patient_id: string
          recorded_at: string
          recorded_by: string
        }
        Insert: {
          admission_id: string
          created_at?: string
          event_data: Json
          event_title: string
          event_type: string
          hospital_id: string
          id?: string
          patient_id: string
          recorded_at?: string
          recorded_by: string
        }
        Update: {
          admission_id?: string
          created_at?: string
          event_data?: Json
          event_title?: string
          event_type?: string
          hospital_id?: string
          id?: string
          patient_id?: string
          recorded_at?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inpatient_timeline_events_admission_id"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "inpatient_admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inpatient_timeline_events_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inpatient_timeline_events_recorded_by"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inpatient_vitals: {
        Row: {
          admission_id: string
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          heart_rate: number | null
          hospital_id: string
          id: string
          notes: string | null
          oxygen_saturation: number | null
          pain_scale: number | null
          patient_id: string
          recorded_at: string
          recorded_by: string
          respiratory_rate: number | null
          temperature: number | null
        }
        Insert: {
          admission_id: string
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          heart_rate?: number | null
          hospital_id: string
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          pain_scale?: number | null
          patient_id: string
          recorded_at?: string
          recorded_by: string
          respiratory_rate?: number | null
          temperature?: number | null
        }
        Update: {
          admission_id?: string
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          heart_rate?: number | null
          hospital_id?: string
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          pain_scale?: number | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string
          respiratory_rate?: number | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inpatient_vitals_admission_id"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "inpatient_admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inpatient_vitals_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inpatient_vitals_recorded_by"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          clinical_notes: string | null
          created_at: string
          doctor_id: string
          hospital_id: string
          id: string
          order_date: string
          ordered_by: string
          patient_id: string
          priority: string
          status: string
          test_type_id: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          clinical_notes?: string | null
          created_at?: string
          doctor_id: string
          hospital_id: string
          id?: string
          order_date?: string
          ordered_by: string
          patient_id: string
          priority?: string
          status?: string
          test_type_id: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          clinical_notes?: string | null
          created_at?: string
          doctor_id?: string
          hospital_id?: string
          id?: string
          order_date?: string
          ordered_by?: string
          patient_id?: string
          priority?: string
          status?: string
          test_type_id?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lab_orders_doctor_id"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_lab_orders_hospital_id"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lab_orders_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lab_orders_test_type_id"
            columns: ["test_type_id"]
            isOneToOne: false
            referencedRelation: "lab_test_types"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_result_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          hospital_id: string
          id: string
          result_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          hospital_id: string
          id?: string
          result_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          hospital_id?: string
          id?: string
          result_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lab_attachments_result_id"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "lab_results"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          comments: string | null
          created_at: string
          hospital_id: string
          id: string
          is_abnormal: boolean | null
          is_critical: boolean | null
          order_id: string
          reference_range: string | null
          result_status: string
          result_value: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          tested_at: string | null
          tested_by: string | null
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          is_abnormal?: boolean | null
          is_critical?: boolean | null
          order_id: string
          reference_range?: string | null
          result_status?: string
          result_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tested_at?: string | null
          tested_by?: string | null
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          is_abnormal?: boolean | null
          is_critical?: boolean | null
          order_id?: string
          reference_range?: string | null
          result_status?: string
          result_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tested_at?: string | null
          tested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lab_results_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_samples: {
        Row: {
          collected_at: string | null
          collected_by: string | null
          created_at: string
          hospital_id: string
          id: string
          notes: string | null
          order_id: string
          received_at: string | null
          sample_condition: string | null
          sample_id: string
          updated_at: string
        }
        Insert: {
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
          hospital_id: string
          id?: string
          notes?: string | null
          order_id: string
          received_at?: string | null
          sample_condition?: string | null
          sample_id: string
          updated_at?: string
        }
        Update: {
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
          hospital_id?: string
          id?: string
          notes?: string | null
          order_id?: string
          received_at?: string | null
          sample_condition?: string | null
          sample_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lab_samples_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_test_types: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          hospital_id: string
          id: string
          is_active: boolean
          name: string
          normal_range: string | null
          preparation_instructions: string | null
          price: number
          sample_type: string
          turnaround_time_hours: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
          normal_range?: string | null
          preparation_instructions?: string | null
          price?: number
          sample_type: string
          turnaround_time_hours?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
          normal_range?: string | null
          preparation_instructions?: string | null
          price?: number
          sample_type?: string
          turnaround_time_hours?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medication_dispensing: {
        Row: {
          created_at: string
          dispensed_at: string
          dispensed_by: string
          hospital_id: string | null
          id: string
          inventory_id: string
          medication_id: string
          notes: string | null
          patient_id: string
          quantity_dispensed: number
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          dispensed_at?: string
          dispensed_by: string
          hospital_id?: string | null
          id?: string
          inventory_id: string
          medication_id: string
          notes?: string | null
          patient_id: string
          quantity_dispensed: number
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          dispensed_at?: string
          dispensed_by?: string
          hospital_id?: string | null
          id?: string
          inventory_id?: string
          medication_id?: string
          notes?: string | null
          patient_id?: string
          quantity_dispensed?: number
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_dispensing_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_dispensing_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "medication_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_dispensing_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_dispensing_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_dispensing_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_inventory: {
        Row: {
          batch_number: string
          created_at: string
          expiry_date: string
          hospital_id: string | null
          id: string
          medication_id: string
          quantity_on_hand: number
          quantity_received: number
          received_date: string
          reorder_point: number
          supplier: string | null
          total_cost: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          expiry_date: string
          hospital_id?: string | null
          id?: string
          medication_id: string
          quantity_on_hand?: number
          quantity_received?: number
          received_date?: string
          reorder_point?: number
          supplier?: string | null
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          expiry_date?: string
          hospital_id?: string | null
          id?: string
          medication_id?: string
          quantity_on_hand?: number
          quantity_received?: number
          received_date?: string
          reorder_point?: number
          supplier?: string | null
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_inventory_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_inventory_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          category: string
          created_at: string
          description: string | null
          dosage: string
          form: string
          generic_name: string | null
          hospital_id: string | null
          id: string
          is_active: boolean
          manufacturer: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          dosage: string
          form: string
          generic_name?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          manufacturer: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          dosage?: string
          form?: string
          generic_name?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          blood_group: string | null
          created_at: string
          date_of_birth: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string
          hospital_id: string | null
          id: string
          last_name: string
          medical_history: string | null
          phone: string | null
          registered_by: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender: string
          hospital_id?: string | null
          id?: string
          last_name: string
          medical_history?: string | null
          phone?: string | null
          registered_by: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string
          hospital_id?: string | null
          id?: string
          last_name?: string
          medical_history?: string | null
          phone?: string | null
          registered_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          bill_id: string
          hospital_id: string | null
          id: string
          notes: string | null
          paid_by: string
          payment_amount: number
          payment_date: string
          payment_method: string
        }
        Insert: {
          bill_id: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          paid_by: string
          payment_amount: number
          payment_date?: string
          payment_method: string
        }
        Update: {
          bill_id?: string
          hospital_id?: string | null
          id?: string
          notes?: string | null
          paid_by?: string
          payment_amount?: number
          payment_date?: string
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          id: string
          instructions: string | null
          quantity: number
          service_id: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string | null
          quantity?: number
          service_id: string
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string | null
          quantity?: number
          service_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          hospital_id: string | null
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          role: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          hospital_id: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          appointment_id: string
          complaints: string | null
          created_at: string
          diagnosis: string | null
          doctor_id: string
          hospital_id: string | null
          id: string
          patient_id: string
          prescriptions: string | null
          treatment_plan: string | null
          updated_at: string
          visit_date: string
          visit_time: string
        }
        Insert: {
          appointment_id: string
          complaints?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          hospital_id?: string | null
          id?: string
          patient_id: string
          prescriptions?: string | null
          treatment_plan?: string | null
          updated_at?: string
          visit_date: string
          visit_time: string
        }
        Update: {
          appointment_id?: string
          complaints?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          hospital_id?: string | null
          id?: string
          patient_id?: string
          prescriptions?: string | null
          treatment_plan?: string | null
          updated_at?: string
          visit_date?: string
          visit_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_signs: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          body_temperature: number | null
          complaints: string | null
          created_at: string
          heart_rate: number | null
          hospital_id: string | null
          id: string
          oxygen_saturation: number | null
          patient_id: string
          recorded_at: string
          recorded_by: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          body_temperature?: number | null
          complaints?: string | null
          created_at?: string
          heart_rate?: number | null
          hospital_id?: string | null
          id?: string
          oxygen_saturation?: number | null
          patient_id: string
          recorded_at?: string
          recorded_by: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          body_temperature?: number | null
          complaints?: string | null
          created_at?: string
          heart_rate?: number | null
          hospital_id?: string | null
          id?: string
          oxygen_saturation?: number | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_signs_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_lab_payment_status: {
        Args: { order_id: string }
        Returns: boolean
      }
      get_current_user_hospital_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_low_stock_medications: {
        Args: Record<PropertyKey, never>
        Returns: {
          medication_name: string
          reorder_point: number
          total_quantity: number
        }[]
      }
      get_payment_status: {
        Args: { amount_paid: number; bill_amount: number }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
