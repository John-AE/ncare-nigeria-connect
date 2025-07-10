import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

const FinanceDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
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

  // Fetch bills with patient information
  const fetchBills = async () => {
    try {
      const { data: billsData, error } = await supabase
        .from('bills')
        .select(`
          *,
          patients(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const billsWithStatus = billsData.map(bill => ({
        ...bill,
        patient_name: `${bill.patients.first_name} ${bill.patients.last_name}`,
        payment_status: getPaymentStatus(bill.amount, bill.amount_paid || 0)
      }));

      setBills(billsWithStatus);
      setFilteredBills(billsWithStatus);
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
      const { error } = await supabase
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

      if (error) throw error;

      toast({
        title: "Payment Recorded",
        description: isFullyPaid ? "Bill has been fully paid!" : "Partial payment recorded successfully",
      });

      setIsPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentMethod("");
      setSelectedBill(null);
      fetchBills(); // Refresh the bills list
      fetchRecentPayments(); // Refresh recent payments
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'fully_paid': return 'default';
      case 'partially_paid': return 'secondary';
      case 'unpaid': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'fully_paid': return 'Fully Paid';
      case 'partially_paid': return 'Partially Paid';
      case 'unpaid': return 'Unpaid';
      default: return 'Unknown';
    }
  };

  useEffect(() => {
    fetchBills();
    fetchRecentPayments();
  }, []);

  // Calculate real-time stats from database
  const pendingBillsCount = bills.filter(bill => bill.payment_status !== 'fully_paid').length;
  const partialPaymentsCount = bills.filter(bill => bill.payment_status === 'partially_paid').length;
  const outstandingAmount = bills
    .filter(bill => bill.payment_status !== 'fully_paid')
    .reduce((total, bill) => total + (bill.amount - (bill.amount_paid || 0)), 0);
  
  // Calculate today's revenue from payments made today
  const today = new Date().toDateString();
  const todaysRevenue = bills
    .filter(bill => {
      if (!bill.paid_at && !bill.updated_at) return false;
      
      // Check if payment was made today (either fully paid today or partially paid today)
      const paymentDate = bill.paid_at ? new Date(bill.paid_at) : new Date(bill.updated_at);
      return paymentDate.toDateString() === today && (bill.amount_paid || 0) > 0;
    })
    .reduce((total, bill) => {
      // For bills paid today, add the amount paid
      // For partial payments made today, we need to be more careful to only count today's payment
      // Since we don't track individual payment transactions, we'll count the full amount_paid
      // This is a simplification - in a full system you'd track individual payment transactions
      return total + (bill.amount_paid || 0);
    }, 0);
  
  const quickStats = [
    { label: "Today's Revenue", value: `₦${todaysRevenue.toLocaleString()}`, color: "bg-accent", showNaira: true },
    { label: "Pending Bills", value: pendingBillsCount.toString(), color: "bg-primary", showNaira: false },
    { label: "Partial Payments", value: partialPaymentsCount.toString(), color: "bg-rose", showNaira: false },
    { label: "Total Outstanding Amount", value: `₦${outstandingAmount.toLocaleString()}`, color: "bg-destructive", showNaira: true }
  ];

  // Filter bills to show only pending ones
  const pendingBills = bills.filter(bill => bill.payment_status !== 'fully_paid');

  const getPaymentMethodDisplay = (method) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'debit_card': return 'Debit Card';
      case 'bank_transfer': return 'Bank Transfer';
      default: return method || 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Finance Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.username}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`h-10 w-10 rounded-full ${stat.color} flex items-center justify-center`}>
                  {stat.showNaira ? (
                    <span className="text-lg font-bold text-white">₦</span>
                  ) : (
                    <span className="text-lg font-bold text-white">#</span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Management */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Management</CardTitle>
            <CardDescription>Search and manage bill payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, bill ID, or description..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-muted-foreground">Loading bills...</p>
              ) : filteredBills.length === 0 ? (
                <p className="text-muted-foreground">No bills found</p>
              ) : (
                filteredBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedBill(bill);
                      setIsPaymentDialogOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{bill.patient_name}</p>
                      <Badge variant={getStatusBadgeVariant(bill.payment_status)}>
                        {getStatusLabel(bill.payment_status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">
                        Amount: ₦{bill.amount.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Paid: ₦{(bill.amount_paid || 0).toLocaleString()}
                      </span>
                    </div>
                    {bill.description && (
                      <p className="text-sm text-muted-foreground mb-1">{bill.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Bill ID: {bill.id.slice(0, 8)}...
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Reports</CardTitle>
            <CardDescription>Generate reports and track revenue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" size="lg">
              Daily Revenue Report
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Outstanding Bills Report
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Payment Methods Analysis
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Monthly Financial Summary
            </Button>
          </CardContent>
        </Card>

        {/* Pending Bills */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Bills</CardTitle>
            <CardDescription>Bills awaiting payment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Loading bills...</p>
              ) : pendingBills.length === 0 ? (
                <p className="text-muted-foreground">No pending bills found</p>
              ) : (
                pendingBills.slice(0, 5).map((bill) => (
                  <div 
                    key={bill.id} 
                    className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedBill(bill);
                      setIsPaymentDialogOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{bill.patient_name}</p>
                      <Badge variant={getStatusBadgeVariant(bill.payment_status)}>
                        ₦{bill.amount.toLocaleString()}
                      </Badge>
                    </div>
                    {bill.description && (
                      <p className="text-sm text-muted-foreground mb-1">{bill.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Generated: {new Date(bill.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Tracking</CardTitle>
            <CardDescription>Recent payments and partial payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground">Loading recent payments...</p>
              ) : recentPayments.length === 0 ? (
                <p className="text-muted-foreground">No recent payments found</p>
              ) : (
                recentPayments.map((payment, index) => (
                  <div key={index} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{payment.patient_name}</p>
                      <Badge variant={payment.percentage === 100 ? "default" : "secondary"}>
                        {getPaymentMethodDisplay(payment.payment_method)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        ₦{(payment.amount_paid || 0).toLocaleString()} of ₦{payment.amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(payment.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Progress value={payment.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {payment.percentage}% paid
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedBill?.patient_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Total Amount:</p>
                  <p>₦{selectedBill.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Amount Paid:</p>
                  <p>₦{(selectedBill.amount_paid || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Outstanding:</p>
                  <p>₦{(selectedBill.amount - (selectedBill.amount_paid || 0)).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Status:</p>
                  <Badge variant={getStatusBadgeVariant(selectedBill.payment_status)}>
                    {getStatusLabel(selectedBill.payment_status)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label htmlFor="payment-amount" className="block text-sm font-medium mb-2">
                  Payment Amount (₦)
                </label>
                <Input
                  id="payment-amount"
                  type="number"
                  placeholder="Enter payment amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  max={selectedBill.amount - (selectedBill.amount_paid || 0)}
                  step="0.01"
                />
              </div>
              
              <div>
                <label htmlFor="payment-method" className="block text-sm font-medium mb-2">
                  Payment Method
                </label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceDashboard;