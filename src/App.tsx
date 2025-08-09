/**
 * NCare Nigeria - Hospital Management System
 * 
 * Main application entry point that sets up routing, authentication, and global providers.
 * This is a complete hospital management system designed for Nigerian healthcare facilities.
 * 
 * @author NCare Nigeria Development Team
 * @version 1.0.0
 */

// UI Components and Providers
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Data fetching and state management
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Routing
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Page Components
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./components/LoginPage";
import { RecordVisit } from "./pages/RecordVisit";

// Dashboard Components - Role-based dashboards for different healthcare professionals
import DoctorDashboard from "./components/dashboards/DoctorDashboard";
import NurseDashboard from "./components/dashboards/NurseDashboard";
import FinanceDashboard from "./components/dashboards/FinanceDashboard";
import { AdminDashboard } from "./components/dashboards/AdminDashboard";
import { PharmacyDashboard } from "./components/dashboards/PharmacyDashboard";
import { LaboratoryDashboard } from "./components/dashboards/LaboratoryDashboard";

// Layout and Authentication
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./components/AuthProvider";

// Global query client for @tanstack/react-query - handles server state management
const queryClient = new QueryClient();

/**
 * Protected Route Component
 * 
 * Ensures that only authenticated users with the correct role can access specific routes.
 * This is crucial for maintaining data security and ensuring users only see information
 * relevant to their role in the hospital.
 * 
 * @param children - The component to render if access is granted
 * @param allowedRole - The role required to access this route (doctor, nurse, finance, admin, pharmacy, laboratory)
 * @returns Either the protected component wrapped in Layout, or redirects to login
 */
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) => {
  const { user, profile, loading } = useAuth();
  
  // Show loading state while authentication is being verified
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  // Redirect to login if user is not authenticated or doesn't have the required role
  if (!user || !profile || profile.role !== allowedRole) {
    return <LoginPage />;
  }
  
  // User is authenticated and has correct role - render the protected content
  return <Layout>{children}</Layout>;
};

/**
 * Main App Component
 * 
 * Sets up the complete application structure with:
 * - Global providers for state management, authentication, and UI
 * - Role-based routing for different hospital staff types
 * - Protected routes to ensure data security
 * 
 * Route Structure:
 * - / : Landing page
 * - /login : Authentication page
 * - /doctor-dashboard : Doctor's workspace for patient consultations and visit recording
 * - /nurse-dashboard : Nurse's workspace for patient registration and appointment management
 * - /finance-dashboard : Finance staff workspace for billing and payment management
 * - /admin-dashboard : Administrative controls and system management
 * - /pharmacy-dashboard : Pharmacy staff workspace for medication management
 * - /laboratory-dashboard : Lab staff workspace for test management and results
 * - /record-visit/:appointmentId : Doctor's interface for recording patient visits
 * - /record-visit/walk-in/:appointmentId : Special route for walk-in patient visits
 * 
 * @returns The complete application component tree
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Authentication provider - manages user sessions and profile data */}
    <AuthProvider>
      {/* UI providers for tooltips and notifications */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes - accessible without authentication */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes - each requires specific role authentication */}
            
            {/* Doctor Dashboard - For medical consultations, visit recording, and patient management */}
            <Route 
              path="/doctor-dashboard" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Nurse Dashboard - For patient registration and appointment scheduling */}
            <Route 
              path="/nurse-dashboard" 
              element={
                <ProtectedRoute allowedRole="nurse">
                  <NurseDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Finance Dashboard - For billing, payments, and financial reporting */}
            <Route 
              path="/finance-dashboard" 
              element={
                <ProtectedRoute allowedRole="finance">
                  <FinanceDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Dashboard - For system administration and user management */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Pharmacy Dashboard - For medication dispensing and inventory management */}
            <Route 
              path="/pharmacy-dashboard" 
              element={
                <ProtectedRoute allowedRole="pharmacy">
                  <PharmacyDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Laboratory Dashboard - For test orders, results entry, and lab billing */}
            <Route 
              path="/laboratory-dashboard" 
              element={
                <ProtectedRoute allowedRole="laboratory">
                  <LaboratoryDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Visit Recording Routes - For doctors to record patient consultations */}
            <Route 
              path="/record-visit/:appointmentId" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <RecordVisit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/record-visit/walk-in/:appointmentId" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <RecordVisit />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route for 404 errors - must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
