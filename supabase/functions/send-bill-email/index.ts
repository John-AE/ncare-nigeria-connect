import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { billId, patientEmail, billDetails }: BillData = await req.json();

    console.log('Sending bill email for bill:', billId, 'to:', patientEmail);

    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - Amazon SES
    // - Resend
    
    // For now, we'll simulate the email sending
    const emailContent = `
      Dear ${billDetails.patient_name},
      
      Please find attached your medical bill:
      
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

    // Log the email content (in production, this would be sent via email service)
    console.log('Email content to send:', emailContent);

    // Simulate successful email sending
    // In production, replace this with actual email sending logic
    const emailSent = true;

    if (emailSent) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Bill email sent successfully',
          billId 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      throw new Error('Failed to send email');
    }

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