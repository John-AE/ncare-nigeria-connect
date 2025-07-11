import { useFinanceDashboard } from "@/hooks/useFinanceDashboard";
import { FinanceStatsCards } from "./finance/FinanceStatsCards";
import { PaymentManagement } from "./finance/PaymentManagement";
import { FinancialReports } from "./finance/FinancialReports";
import { PendingBills } from "./finance/PendingBills";
import { PaymentTracking } from "./finance/PaymentTracking";
import { PaymentDialog } from "./finance/PaymentDialog";

const FinanceDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const {
    filteredBills,
    searchTerm,
    selectedBill,
    paymentAmount,
    paymentMethod,
    isPaymentDialogOpen,
    loading,
    recentPayments,
    pendingBillsCount,
    partialPaymentsCount,
    outstandingAmount,
    todaysRevenue,
    pendingBills,
    setSelectedBill,
    setPaymentAmount,
    setPaymentMethod,
    setIsPaymentDialogOpen,
    handleSearch,
    handlePayment,
  } = useFinanceDashboard();

  const handleBillSelect = (bill: any) => {
    setSelectedBill(bill);
    setIsPaymentDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Finance Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.username}</p>
      </div>

      {/* Quick Stats */}
      <FinanceStatsCards
        todaysRevenue={todaysRevenue}
        pendingBillsCount={pendingBillsCount}
        partialPaymentsCount={partialPaymentsCount}
        outstandingAmount={outstandingAmount}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Management */}
        <PaymentManagement
          searchTerm={searchTerm}
          filteredBills={filteredBills}
          loading={loading}
          onSearch={handleSearch}
          onBillSelect={handleBillSelect}
        />

        {/* Payment Tracking */}
        <PaymentTracking
          recentPayments={recentPayments}
          loading={loading}
        />

        {/* Financial Reports */}
        <FinancialReports />

        {/* Pending Bills */}
        <PendingBills
          pendingBills={pendingBills}
          loading={loading}
          onBillSelect={handleBillSelect}
        />
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        selectedBill={selectedBill}
        paymentAmount={paymentAmount}
        paymentMethod={paymentMethod}
        onPaymentAmountChange={setPaymentAmount}
        onPaymentMethodChange={setPaymentMethod}
        onPayment={handlePayment}
      />
    </div>
  );
};

export default FinanceDashboard;