import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BillData {
  billId: string;
  patientEmail: string;
  billDetails: {
    patient_name: string;
    amount: number;
    description: string;
    created_at: string;
    items: Array<{
      service_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { billId, patientEmail, billDetails }: BillData = await req.json();

    console.log('Sending bill email for bill:', billId, 'to:', patientEmail);
    
    const emailContent = `
      Dear ${billDetails.patient_name},
      
      Please find your medical bill details:
      
      Bill ID: ${billId}
      Amount: ₦${billDetails.amount.toLocaleString()}
      Description: ${billDetails.description}
      Date: ${new Date(billDetails.created_at).toLocaleDateString()}
      
      Services:
      ${billDetails.items.map(item => 
        `- ${item.service_name} x${item.quantity}: ₦${item.total_price.toLocaleString()}`
      ).join('\n')}
      
      Total: ₦${billDetails.amount.toLocaleString()}
      
      Thank you for choosing our healthcare services.
      
      Best regards,
      Hospital Management System
    `;

    console.log('Sending email via Resend to:', patientEmail);

    const emailResponse = await resend.emails.send({
      from: 'Hospital Management <onboarding@resend.dev>',
      to: [patientEmail],
      subject: `Medical Bill - ${billId}`,
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
        billId,
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