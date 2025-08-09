# NCare Nigeria - Hospital Management System

**A comprehensive, modern hospital management system designed specifically for Nigerian healthcare facilities.**


[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)

## 🏥 Project Overview

NCare Nigeria is a full-featured hospital management system that streamlines healthcare operations through role-based dashboards and comprehensive patient care workflows. The system is built with modern web technologies and designed to enhance service delivery in Nigerian hospitals.


## 🎯 Key Features

### 👨‍⚕️ **Doctor Dashboard**
- **Patient Consultations**: Complete visit recording with diagnosis, prescriptions, and lab orders
- **Appointment Management**: View and manage scheduled patient appointments
- **Billing Integration**: Generate bills for services and medications
- **Lab Test Ordering**: Order laboratory tests and view results
- **Patient Timeline**: Comprehensive patient history and treatment tracking

### 👩‍⚕️ **Nurse Dashboard**
- **Patient Registration**: Register new patients with comprehensive medical history
- **Appointment Scheduling**: Schedule regular and recurring appointments
- **Triage Management**: Assess patient priority and record vital signs
- **Patient Queue Management**: Manage scheduled patients and walk-ins
- **Statistics Tracking**: Monitor daily registrations and appointments

### 💰 **Finance Dashboard**
- **Billing Management**: Track pending, partial, and fully paid bills
- **Payment Processing**: Record payments with multiple payment methods
- **Financial Reporting**: Generate revenue reports and analytics
- **Outstanding Bills**: Manage unpaid and partially paid accounts
- **Payment History**: Complete audit trail of all transactions

### 🏥 **Administrative Dashboard**
- **User Management**: Create and manage staff accounts
- **System Analytics**: Hospital-wide statistics and reporting
- **Department Oversight**: Monitor all departmental activities
- **Access Control**: Manage user roles and permissions

### 💊 **Pharmacy Dashboard**
- **Medication Dispensing**: Process and fulfill prescriptions
- **Inventory Management**: Track medication stock levels and reorders
- **Prescription History**: Complete medication dispensing records
- **Low Stock Alerts**: Automated inventory monitoring
- **Drug Information**: Comprehensive medication database

### 🔬 **Laboratory Dashboard**
- **Test Order Processing**: Manage incoming lab test requests
- **Results Entry**: Record and validate test results
- **Billing Integration**: Generate bills for laboratory services
- **Test Type Management**: Configure available lab tests and pricing
- **Quality Control**: Track test processing and turnaround times

## 🏗️ System Architecture

### **Frontend Architecture**
```
src/
├── components/              # Reusable UI components
│   ├── ui/                 # Base UI components (shadcn/ui)
│   ├── dashboards/         # Role-specific dashboard components
│   │   ├── doctor/         # Doctor-specific components
│   │   ├── nurse/          # Nurse-specific components
│   │   ├── finance/        # Finance-specific components
│   │   ├── pharmacy/       # Pharmacy-specific components
│   │   └── laboratory/     # Laboratory-specific components
│   └── record-visit/       # Visit recording workflow components
├── hooks/                  # Custom React hooks for state management
├── pages/                  # Main page components
├── lib/                    # Utility functions and helpers
├── integrations/          # External service integrations
│   └── supabase/          # Supabase client and types
└── types/                 # TypeScript type definitions
```

### **Backend Architecture (Supabase)**
- **Authentication**: Row Level Security (RLS) with role-based access
- **Database**: PostgreSQL with automated backups
- **Real-time**: Live updates for critical hospital data
- **Edge Functions**: Custom business logic and integrations
- **Storage**: Secure file handling for medical documents

### **Database Schema**
```sql
-- Core Tables
patients              # Patient information and medical history
appointments          # Scheduled and completed appointments
visits               # Consultation records and diagnoses
bills                # Financial transactions and billing
prescriptions        # Medication orders and dispensing
lab_test_orders      # Laboratory test requests
lab_test_results     # Test results and values

-- Staff and Administration
profiles             # User profiles and role assignments
hospitals            # Hospital information and settings

-- Pharmacy Management
medications          # Medication catalog
medication_inventory # Stock levels and pricing
medication_dispensing # Dispensing records

-- Laboratory Management
lab_test_types       # Available tests and pricing
test_categories      # Test groupings and organization
```

## 🔐 Security & Access Control

### **Role-Based Access Control (RBAC)**
1. **Doctor**: Full access to patient care, limited billing view
2. **Nurse**: Patient registration, appointment management, limited medical records
3. **Finance**: Full billing access, limited patient medical information
4. **Admin**: System-wide access and user management
5. **Pharmacy**: Medication management and prescription fulfillment
6. **Laboratory**: Test management and results entry

### **Data Security**
- **Row Level Security (RLS)**: Database-level access control
- **Hospital Isolation**: Multi-tenant architecture with hospital-specific data
- **Session Management**: Secure authentication with automatic logout
- **Audit Trails**: Complete logging of all data modifications

## 🚀 Technology Stack

### **Frontend**
- **React 18.3.1**: Modern functional components with hooks
- **TypeScript**: Type-safe development with excellent IDE support
- **Tailwind CSS**: Utility-first styling with custom design system
- **shadcn/ui**: High-quality, accessible UI components
- **React Router**: Client-side routing with protected routes
- **@tanstack/react-query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Zod**: Runtime type validation

### **Backend & Infrastructure**
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **PostgreSQL**: Robust relational database with ACID compliance
- **Row Level Security**: Database-level authorization
- **Real-time Subscriptions**: Live data updates
- **Edge Functions**: Serverless functions for custom logic

### **Development Tools**
- **Vite**: Fast development server and build tool
- **ESLint**: Code linting and quality assurance
- **TypeScript**: Static type checking
- **Git**: Version control with automated deployments

## 🔄 Key Workflows

### **Patient Registration & Care Workflow**
1. **Registration**: Nurse registers new patient with medical history
2. **Appointment**: System auto-schedules or manual scheduling
3. **Triage**: Nurse records vital signs and priority assessment
4. **Consultation**: Doctor records diagnosis, prescriptions, lab orders
5. **Billing**: System generates comprehensive bill
6. **Fulfillment**: Pharmacy dispenses medications, lab processes tests
7. **Follow-up**: Results recorded, follow-up appointments scheduled

### **Financial Workflow**
1. **Bill Generation**: Automatic creation from consultations and services
2. **Payment Processing**: Multiple payment methods supported
3. **Tracking**: Real-time status updates (unpaid/partial/paid)
4. **Reporting**: Financial analytics and revenue tracking
5. **Audit**: Complete transaction history and compliance

### **Laboratory Workflow**
1. **Order Receipt**: Tests ordered by doctors during consultations
2. **Sample Processing**: Lab staff process and analyze samples
3. **Results Entry**: Validated results entered into system
4. **Billing**: Automatic bill generation for lab services
5. **Reporting**: Results available to ordering physicians

## 📊 Real-time Features

### **Live Dashboard Updates**
- **Patient Queues**: Real-time updates as patients move through workflow
- **Appointment Status**: Live tracking of patient arrivals and completions
- **Billing Status**: Instant updates when payments are processed
- **Inventory Alerts**: Real-time low stock notifications
- **Test Results**: Immediate availability when lab results are entered

### **Notification System**
- **Toast Notifications**: Immediate feedback for user actions
- **Status Updates**: Real-time workflow progression
- **Success Confirmations**: Clear confirmation of critical actions
- **Error Handling**: Graceful error messages and recovery options

## 🎨 Design System

### **Color Palette**
- **Primary Blue (#3B82F6)**: Professional medical theme
- **Success Green (#059669)**: Positive actions and confirmations
- **Warning Amber (#D97706)**: Attention-required items
- **Error Red (#EF4444)**: Critical alerts and destructive actions
- **Neutral Grays**: Professional, accessible text and backgrounds

### **UI Components**
- **Consistent Typography**: Professional hierarchy with Inter font
- **Accessible Colors**: WCAG-compliant contrast ratios
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Interactive Elements**: Clear hover states and loading indicators

## 🔧 Development Setup

### **Prerequisites**
- Node.js (v18 or higher)
- npm or yarn package manager
- Git for version control

### **Installation**
```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Environment Setup**
The application uses Supabase for backend services. All configuration is handled automatically through the Lovable platform.

## 📈 Performance & Scalability

### **Optimization Features**
- **Code Splitting**: Lazy loading of route components
- **Query Caching**: Intelligent data caching with @tanstack/react-query
- **Real-time Subscriptions**: Efficient WebSocket connections
- **Image Optimization**: Compressed assets and lazy loading
- **Bundle Optimization**: Tree-shaking and minification

### **Scalability Considerations**
- **Multi-tenant Architecture**: Hospital-specific data isolation
- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: Efficient database connection management
- **CDN Integration**: Fast asset delivery globally

## 🚀 Deployment

### **Lovable Platform**
1. Click the "Publish" button in the Lovable interface
2. Automatic deployment to global CDN
3. Custom domain support available
4. SSL certificates included

### **Manual Deployment**
```bash
# Build the application
npm run build

# Deploy to your preferred hosting platform
# (Vercel, Netlify, AWS, etc.)
```

## 🔒 Data Privacy & Compliance

### **Nigerian Healthcare Compliance**
- **Patient Data Protection**: Secure handling of medical information
- **Access Logging**: Complete audit trails for compliance
- **Data Retention**: Configurable retention policies
- **Backup & Recovery**: Automated data protection

### **Security Measures**
- **Encryption**: All data encrypted in transit and at rest
- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based access with principle of least privilege
- **Monitoring**: Real-time security monitoring and alerts

## 📞 Support & Documentation

### **Getting Help**
- **Documentation**: Comprehensive guides for each role
- **Training Materials**: Step-by-step workflow instructions
- **Support Channels**: Direct access to development team
- **Community**: Nigerian healthcare IT professionals network

### **Feedback & Improvements**
- **Feature Requests**: Continuous improvement based on user feedback
- **Bug Reports**: Rapid issue resolution and updates
- **Training**: Ongoing staff training and system updates

## 🤝 Contributing

This project is actively developed by the NCare Nigeria team. For suggestions, issues, or improvements, please contact the development team through the Lovable platform.

## 📄 License

© 2025 NCare Nigeria. Designed for Nigerian Healthcare.

---

**Built with ❤️ for Nigerian Healthcare Professionals**

This system represents a significant step forward in digitalizing healthcare management in Nigeria, providing healthcare professionals with the tools they need to deliver exceptional patient care while maintaining operational efficiency.