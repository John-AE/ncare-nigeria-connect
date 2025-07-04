import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const FinanceDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const quickStats = [
    { label: "Today's Revenue", value: "₦125,000", color: "bg-accent" },
    { label: "Pending Bills", value: "18", color: "bg-primary" },
    { label: "Partial Payments", value: "7", color: "bg-secondary" },
    { label: "Outstanding Amount", value: "₦45,000", color: "bg-destructive" }
  ];

  const pendingBills = [
    { patient: "John Doe", amount: "₦15,000", date: "Today", services: "Consultation, Lab Test" },
    { patient: "Jane Smith", amount: "₦8,500", date: "Today", services: "Checkup, Prescription" },
    { patient: "Mike Johnson", amount: "₦22,000", date: "Yesterday", services: "Surgery, Medication" }
  ];

  const paymentHistory = [
    { patient: "Sarah Wilson", amount: "₦10,000", paid: "₦6,000", percentage: 60, time: "11:30 AM", method: "Cash" },
    { patient: "David Brown", amount: "₦18,000", paid: "₦18,000", percentage: 100, time: "10:15 AM", method: "Bank Transfer" },
    { patient: "Emma Davis", amount: "₦12,000", paid: "₦4,000", percentage: 33, time: "9:45 AM", method: "Mobile Money" }
  ];

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
                  <span className="text-lg font-bold text-white">₦</span>
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
            <CardDescription>Process payments and manage transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" size="lg">
              Record New Payment
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              View Payment History
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Generate Receipt
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Send Payment Reminder
            </Button>
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
              {pendingBills.map((bill, index) => (
                <div key={index} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{bill.patient}</p>
                    <Badge variant="outline">{bill.amount}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{bill.services}</p>
                  <p className="text-xs text-muted-foreground">Generated: {bill.date}</p>
                </div>
              ))}
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
              {paymentHistory.map((payment, index) => (
                <div key={index} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{payment.patient}</p>
                    <Badge variant={payment.percentage === 100 ? "default" : "secondary"}>
                      {payment.method}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {payment.paid} of {payment.amount}
                    </span>
                    <span className="text-xs text-muted-foreground">{payment.time}</span>
                  </div>
                  <Progress value={payment.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {payment.percentage}% paid
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;