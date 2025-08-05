import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useFinanceDashboard = () => {
  const { toast } = useToast();
  
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);

  // Initialize data fetching
  useEffect(() => {
    fetchBills();
    fetchRecentPayments();
  }, []);

  // Fetch bills with patient information including lab test bills
  const fetchBills = async () => {
    try {
      // Fetch all bills (including lab test bills from the database)
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select(`
          *,
          patients(first_name, last_name),
          lab_orders(
            lab_test_types(name, code)
          )
        `)
        .order('created_at', { ascending: false });

      if (billsError) throw billsError;

      // Transform bills data to include proper bill types and payment status
      const allBills = billsData.map(bill => ({
        ...bill,
        patient_name: `${bill.patients.first_name} ${bill.patients.last_name}`,
        payment_status: getPaymentStatus(bill.amount, bill.amount_paid || 0),
        bill_type: bill.bill_type || 'medical_service',
        // Add lab test name for lab test bills
        lab_test_name: bill.lab_orders?.[0]?.lab_test_types?.name || null
      }));

      setBills(allBills);
      setFilteredBills(allBills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent payments
  const fetchRecentPayments = async () => {
    try {
      const { data: paymentsData, error } = await supabase
        .from('bills')
        .select(`
          *,
          patients(first_name, last_name)
        `)
        .not('amount_paid', 'is', null)
        .gt('amount_paid', 0)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const paymentsWithDetails = paymentsData.map(bill => ({
        ...bill,
        patient_name: `${bill.patients.first_name} ${bill.patients.last_name}`,
        payment_status: getPaymentStatus(bill.amount, bill.amount_paid || 0),
        percentage: Math.round((bill.amount_paid / bill.amount) * 100)
      }));

      setRecentPayments(paymentsWithDetails);
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  };

  // Calculate payment status
  const getPaymentStatus = (amount, amountPaid) => {
    if (amountPaid === 0) return 'unpaid';
    if (amountPaid >= amount) return 'fully_paid';
    return 'partially_paid';
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredBills(bills);
      return;
    }

    const filtered = bills.filter(bill => 
      bill.patient_name.toLowerCase().includes(value.toLowerCase()) ||
      bill.id.toLowerCase().includes(value.toLowerCase()) ||
      bill.description?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredBills(filtered);
  };

// Handle payment
const handlePayment = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast({
      title: "Authentication Error",
      description: "Please log in again",
      variant: "destructive",
    });
    return;
  }
  console.log('Current user from localStorage:', user);
  
  if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
    toast({
      title: "Invalid Amount",
      description: "Please enter a valid payment amount",
      variant: "destructive",
    });
    return;
  }

  if (!paymentMethod) {
    toast({
      title: "Payment Method Required",
      description: "Please select a payment method",
      variant: "destructive",
    });
    return;
  }

  const newAmountPaid = (selectedBill.amount_paid || 0) + parseFloat(paymentAmount);
  const isFullyPaid = newAmountPaid >= selectedBill.amount;

  try {
    console.log('Recording payment for bill:', selectedBill);
    
    // Update the bill record
    const { error: billError } = await supabase
      .from('bills')
      .update({
        amount_paid: newAmountPaid,
        is_paid: isFullyPaid,
        paid_at: isFullyPaid ? new Date().toISOString() : null,
        paid_by: user.id,
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedBill.id);

    if (billError) throw billError;

    // Get hospital_id from profiles table
    const { data: profileData } = await supabase
      .from('profiles')
      .select('hospital_id')
      .eq('user_id', user.id)
      .single();

    // Create payment history record
    console.log('User data:', user);
    console.log('User metadata:', user.user_metadata);
    const { error: paymentError } = await supabase
      .from('payment_history')
      .insert({
        bill_id: selectedBill.id,
        payment_amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        paid_by: user.id,
        hospital_id: profileData?.hospital_id,
      });

    console.log('Payment history insert error:', paymentError);

    if (paymentError) {
      console.error('Payment history error details:', paymentError);
      throw paymentError;
    }

    toast({
      title: "Payment Recorded",
      description: isFullyPaid ? "Bill has been fully paid!" : "Partial payment recorded successfully",
    });

    setIsPaymentDialogOpen(false);
    setPaymentAmount("");
    setPaymentMethod("");
    setSelectedBill(null);
    fetchBills();
    fetchRecentPayments();
  } catch (error) {
    console.error('Error recording payment:', error);
    toast({
      title: "Error",
      description: "Failed to record payment",
      variant: "destructive",
    });
  }
};

  // Calculate stats
  const pendingBillsCount = bills.filter(bill => bill.payment_status !== 'fully_paid').length;
  const partialPaymentsCount = bills.filter(bill => bill.payment_status === 'partially_paid').length;
  const outstandingAmount = bills
    .filter(bill => bill.payment_status !== 'fully_paid')
    .reduce((total, bill) => total + (bill.amount - (bill.amount_paid || 0)), 0);
  
  // Calculate today's revenue
  const today = new Date().toDateString();
  const todaysRevenue = bills
    .filter(bill => {
      if (!bill.paid_at && !bill.updated_at) return false;
      const paymentDate = bill.paid_at ? new Date(bill.paid_at) : new Date(bill.updated_at);
      return paymentDate.toDateString() === today && (bill.amount_paid || 0) > 0;
    })
    .reduce((total, bill) => total + (bill.amount_paid || 0), 0);

  const pendingBills = bills.filter(bill => bill.payment_status !== 'fully_paid');

  return {
    // State
    bills,
    filteredBills,
    searchTerm,
    selectedBill,
    paymentAmount,
    paymentMethod,
    isPaymentDialogOpen,
    loading,
    recentPayments,
    
    // Computed values
    pendingBillsCount,
    partialPaymentsCount,
    outstandingAmount,
    todaysRevenue,
    pendingBills,
    
    // Actions
    setSearchTerm,
    setSelectedBill,
    setPaymentAmount,
    setPaymentMethod,
    setIsPaymentDialogOpen,
    handleSearch,
    handlePayment,
    getPaymentStatus,
  };
};