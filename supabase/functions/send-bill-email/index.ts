import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BillData {
  email: string;
  patient_name: string;
  bill_id: string;
  bill_amount: number;
  bill_items: Array<{
    id?: string;
    service_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  appointment_time: string;
  is_paid: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { email, patient_name, bill_id, bill_amount, bill_items, appointment_time, is_paid }: BillData = await req.json();

    console.log('Sending bill email for bill:', bill_id, 'to:', email);
    
    const emailContent = `
      Dear ${patient_name},
      
      Please find your medical bill details:
      
      Bill ID: ${bill_id}
      Amount: ₦${bill_amount?.toLocaleString() || 'N/A'}
      Appointment Time: ${appointment_time}
      Status: ${is_paid ? 'Paid' : 'Pending'}
      
      Services:
      ${bill_items.map(item => 
        `- ${item.service_name} x${item.quantity}: ₦${item.total_price.toLocaleString()}`
      ).join('\n')}
      
      Total: ₦${bill_amount?.toLocaleString() || 'N/A'}
      
      Thank you for choosing our healthcare services.
      
      Best regards,
      Hospital Management System
    `;

    console.log('Sending email via Resend to:', email);

    const emailResponse = await resend.emails.send({
      from: 'NCare Nigeria <billing@123185.xyz>',
      to: [email],
      subject: `Medical Bill - ${patient_name}`,
      html: emailContent.replace(/\n/g, '<br>'),
    });

    console.log('Resend response:', emailResponse);

    if (emailResponse.error) {
      throw new Error(`Resend error: ${emailResponse.error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Bill email sent successfully',
        billId: bill_id,
        emailId: emailResponse.data?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-bill-email function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send bill email' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});