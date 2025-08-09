# NCare Nigeria - Developer Guide

## 📚 Complete Technical Documentation

This guide provides comprehensive information about the NCare Nigeria Hospital Management System architecture, codebase structure, and development practices.

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Role-Based Dashboards                                     │
│  ├── Doctor Dashboard    ├── Nurse Dashboard                │
│  ├── Finance Dashboard   ├── Admin Dashboard               │
│  ├── Pharmacy Dashboard  └── Laboratory Dashboard          │
├─────────────────────────────────────────────────────────────┤
│  State Management & Data Layer                             │
│  ├── @tanstack/react-query (Server State)                 │
│  ├── React Hooks (Local State)                            │
│  └── Real-time Subscriptions (Supabase)                   │
├─────────────────────────────────────────────────────────────┤
│  Authentication & Authorization                            │
│  ├── Supabase Auth (Session Management)                   │
│  ├── Row Level Security (Database-level Protection)       │
│  └── Role-based Access Control                            │
├─────────────────────────────────────────────────────────────┤
│                    Backend (Supabase)                      │
│  ├── PostgreSQL Database with RLS                         │
│  ├── Real-time Engine (WebSockets)                        │
│  ├── Edge Functions (Serverless)                          │
│  └── Authentication Engine                                 │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Codebase Structure

### File Organization
```
src/
├── components/              # All React components
│   ├── ui/                 # Base UI components (shadcn/ui)
│   │   ├── button.tsx      # Reusable button component
│   │   ├── card.tsx        # Card container component
│   │   ├── dialog.tsx      # Modal/dialog component
│   │   └── ...             # Other UI primitives
│   ├── dashboards/         # Role-specific dashboard components
│   │   ├── doctor/         # Doctor dashboard components
│   │   │   ├── QuickStatsCards.tsx     # Doctor statistics
│   │   │   ├── TodaysSchedule.tsx      # Today's appointments
│   │   │   ├── BillingCard.tsx         # Billing interface
│   │   │   └── ...
│   │   ├── nurse/          # Nurse dashboard components
│   │   │   ├── PatientManagement.tsx   # Patient registration
│   │   │   ├── TriageQueue.tsx         # Patient triage
│   │   │   ├── VitalsRecording.tsx     # Vital signs
│   │   │   └── ...
│   │   ├── finance/        # Finance dashboard components
│   │   │   ├── PaymentManagement.tsx   # Payment processing
│   │   │   ├── PendingBills.tsx        # Outstanding bills
│   │   │   ├── FinancialReports.tsx    # Financial analytics
│   │   │   └── ...
│   │   ├── pharmacy/       # Pharmacy dashboard components
│   │   │   ├── MedicationInventory.tsx # Stock management
│   │   │   ├── DispenseMedication.tsx  # Prescription fulfillment
│   │   │   └── ...
│   │   └── laboratory/     # Laboratory dashboard components
│   │       ├── TestOrdersQueue.tsx     # Test processing
│   │       ├── EnterResults.tsx        # Results entry
│   │       └── ...
│   ├── record-visit/       # Doctor visit recording workflow
│   │   ├── PatientInfoCard.tsx         # Patient information display
│   │   ├── VisitDetailsCard.tsx        # Visit recording form
│   │   ├── LabTestOrderingCard.tsx     # Lab test orders
│   │   ├── PatientBillingSystem.tsx    # Visit billing
│   │   └── ...
│   ├── AuthProvider.tsx    # Authentication context provider
│   ├── Layout.tsx          # Main layout wrapper
│   ├── LoginPage.tsx       # User authentication
│   └── ...
├── hooks/                  # Custom React hooks
│   ├── useDoctorDashboardStats.ts      # Doctor statistics
│   ├── useNurseDashboardStats.ts       # Nurse statistics
│   ├── useFinanceDashboard.ts          # Finance statistics
│   ├── usePharmacyDashboard.ts         # Pharmacy statistics
│   ├── useLaboratoryDashboard.ts       # Laboratory statistics
│   ├── useRecordVisit.ts               # Visit recording logic
│   └── use-toast.ts                    # Toast notifications
├── lib/                    # Utility libraries
│   ├── utils.ts            # General utilities (cn function)
│   └── financeUtils.ts     # Finance-specific utilities
├── pages/                  # Main page components
│   ├── Index.tsx           # Landing page
│   ├── RecordVisit.tsx     # Visit recording page
│   └── NotFound.tsx        # 404 page
├── integrations/           # External service integrations
│   └── supabase/          # Supabase configuration
│       ├── client.ts       # Supabase client setup
│       └── types.ts        # Database type definitions
├── types/                  # TypeScript type definitions
│   └── recordVisit.ts      # Visit recording types
├── index.css              # Global styles and design system
└── main.tsx               # Application entry point
```

## 🔐 Authentication & Authorization

### Authentication Flow
1. **User Login**: Users authenticate with email/password through `LoginPage.tsx`
2. **Session Management**: `AuthProvider.tsx` manages user sessions and profile data
3. **Role Assignment**: User profiles contain role information (doctor, nurse, etc.)
4. **Route Protection**: `ProtectedRoute` component ensures only authorized users access specific routes

### Role-Based Access Control (RBAC)
```typescript
// Role definitions and their access levels
const ROLES = {
  doctor: {
    access: ['patients', 'appointments', 'visits', 'prescriptions', 'lab_orders'],
    dashboards: ['/doctor-dashboard'],
    permissions: ['read_patient_data', 'write_medical_records', 'order_tests']
  },
  nurse: {
    access: ['patients', 'appointments', 'vitals', 'triage'],
    dashboards: ['/nurse-dashboard'],
    permissions: ['register_patients', 'schedule_appointments', 'record_vitals']
  },
  finance: {
    access: ['bills', 'payments', 'financial_reports'],
    dashboards: ['/finance-dashboard'],
    permissions: ['process_payments', 'view_financial_data', 'generate_reports']
  },
  // ... other roles
};
```

### Database Security (Row Level Security)
```sql
-- Example RLS policy for patient data
CREATE POLICY "Users can only access patients from their hospital" 
ON patients FOR ALL 
USING (hospital_id = get_current_user_hospital_id());

-- Example RLS policy for role-based access
CREATE POLICY "Doctors can view all patient medical data" 
ON visits FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'doctor'
    AND hospital_id = visits.hospital_id
  )
);
```

## 📊 Data Flow & State Management

### State Management Strategy
1. **Server State**: Managed by `@tanstack/react-query`
   - Automatic caching and background updates
   - Optimistic updates for better UX
   - Error handling and retry logic

2. **Local Component State**: React `useState` and `useReducer`
   - Form state and UI interactions
   - Modal visibility and component state
   - Temporary data before server sync

3. **Real-time Updates**: Supabase subscriptions
   - Live updates for critical data (patient queues, appointments)
   - Automatic UI refresh when data changes
   - Multi-user collaboration support

### Data Flow Example: Patient Registration
```typescript
// 1. User fills form (Local State)
const [formData, setFormData] = useState(initialData);

// 2. Form submission (Server State via React Query)
const registerPatient = useMutation({
  mutationFn: async (data) => {
    const { data: patient } = await supabase
      .from('patients')
      .insert(data)
      .select()
      .single();
    return patient;
  },
  onSuccess: () => {
    // 3. Automatic cache invalidation and refresh
    queryClient.invalidateQueries(['patients']);
    toast.success('Patient registered successfully');
  }
});

// 4. Real-time subscription updates other components
useEffect(() => {
  const subscription = supabase
    .channel('patients')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'patients' },
      (payload) => {
        // Update local state with new patient
        queryClient.setQueryData(['patients'], (old) => [...old, payload.new]);
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

## 🎨 Design System & Styling

### Design Tokens (index.css)
```css
:root {
  /* Core Colors - Professional Healthcare Theme */
  --primary: 217 91% 60%;          /* Professional Blue */
  --secondary: 215 20% 92%;        /* Light Gray */
  --accent: 158 64% 52%;           /* Healthcare Green */
  --destructive: 0 84% 60%;        /* Alert Red */
  
  /* Custom Healthcare Colors */
  --rose: 343 75% 59%;             /* Partial Payment */
  --amber: 32 95% 44%;             /* Appointments */
  
  /* Layout */
  --background: 220 14% 96%;       /* Page Background */
  --card: 0 0% 100%;               /* Card Background */
  --border: 220 13% 91%;           /* Border Color */
}
```

### Component Styling Principles
1. **Semantic Tokens**: Always use CSS custom properties, never hardcoded colors
2. **Responsive Design**: Mobile-first approach with Tailwind breakpoints
3. **Accessibility**: WCAG-compliant contrast ratios and focus indicators
4. **Consistency**: Reusable component variants for different states

### Example Component with Proper Styling
```typescript
// ✅ Good: Uses design system tokens
<Button 
  variant="primary" 
  className="bg-primary text-primary-foreground hover:bg-primary-hover"
>
  Save Patient
</Button>

// ❌ Bad: Hardcoded colors
<Button className="bg-blue-500 text-white hover:bg-blue-600">
  Save Patient
</Button>
```

## 🔄 Real-time Features Implementation

### Real-time Subscriptions
```typescript
// Example: Real-time patient queue updates
const usePatientQueue = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    // Initial data fetch
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'waiting');
      setPatients(data || []);
    };

    // Real-time subscription
    const subscription = supabase
      .channel('patient_queue')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public', 
        table: 'patients'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPatients(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setPatients(prev => 
            prev.map(p => p.id === payload.new.id ? payload.new : p)
          );
        } else if (payload.eventType === 'DELETE') {
          setPatients(prev => 
            prev.filter(p => p.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    fetchPatients();
    return () => subscription.unsubscribe();
  }, []);

  return { patients };
};
```

## 🚀 Performance Optimization

### Code Splitting & Lazy Loading
```typescript
// Lazy load dashboard components
const DoctorDashboard = lazy(() => import('./components/dashboards/DoctorDashboard'));
const NurseDashboard = lazy(() => import('./components/dashboards/NurseDashboard'));

// Route-based code splitting
<Route 
  path="/doctor-dashboard" 
  element={
    <Suspense fallback={<Loading />}>
      <ProtectedRoute allowedRole="doctor">
        <DoctorDashboard />
      </ProtectedRoute>
    </Suspense>
  } 
/>
```

### Query Optimization
```typescript
// Efficient data fetching with React Query
const useDashboardData = () => {
  return useQueries({
    queries: [
      {
        queryKey: ['stats'],
        queryFn: fetchDashboardStats,
        staleTime: 30000,      // Data is fresh for 30 seconds
        cacheTime: 300000,     // Keep in cache for 5 minutes
      },
      {
        queryKey: ['appointments'],
        queryFn: fetchTodaysAppointments,
        refetchInterval: 60000, // Refetch every minute
      }
    ]
  });
};
```

### Component Optimization
```typescript
// Memoized components for expensive renders
const PatientCard = memo(({ patient, onUpdate }) => {
  return (
    <Card>
      <CardContent>
        <h3>{patient.name}</h3>
        <p>{patient.diagnosis}</p>
        <Button onClick={() => onUpdate(patient.id)}>
          Update
        </Button>
      </CardContent>
    </Card>
  );
});

// Optimized callback functions
const handlePatientUpdate = useCallback((patientId) => {
  // Update logic here
}, []);
```

## 🧪 Testing Strategy

### Unit Testing
```typescript
// Example test for utility function
describe('financeUtils', () => {
  test('getStatusBadgeVariant returns correct variant', () => {
    expect(getStatusBadgeVariant('fully_paid')).toBe('default');
    expect(getStatusBadgeVariant('unpaid')).toBe('destructive');
  });
});
```

### Integration Testing
```typescript
// Example test for component integration
describe('PatientRegistrationForm', () => {
  test('submits form data correctly', async () => {
    render(<PatientRegistrationForm isOpen={true} onClose={jest.fn()} />);
    
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'John' }
    });
    fireEvent.click(screen.getByText('Register Patient'));
    
    await waitFor(() => {
      expect(mockSupabaseInsert).toHaveBeenCalledWith({
        first_name: 'John',
        // ... other fields
      });
    });
  });
});
```

## 🔧 Development Workflow

### Branch Strategy
```
main                 # Production branch
├── develop         # Development integration
├── feature/xxx     # Feature branches
├── fix/xxx         # Bug fix branches
└── hotfix/xxx      # Emergency fixes
```

### Code Quality Standards
1. **TypeScript**: Strict type checking enabled
2. **ESLint**: Code linting with healthcare-specific rules
3. **Prettier**: Consistent code formatting
4. **Husky**: Pre-commit hooks for quality checks

### Environment Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📚 API Reference

### Custom Hooks

#### `useDoctorDashboardStats()`
Returns real-time statistics for doctor dashboard.
```typescript
const stats = useDoctorDashboardStats();
// Returns: { totalAppointmentsToday, completedAppointments, pendingBills, ... }
```

#### `useNurseDashboardStats()`
Returns real-time statistics for nurse dashboard.
```typescript
const { stats, loading, refetch } = useNurseDashboardStats();
// Returns: { totalPatients, newPatientsToday, todaysAppointments, ... }
```

#### `useRecordVisit(appointmentId)`
Manages visit recording workflow for doctors.
```typescript
const {
  appointment,
  visitData,
  setVisitData,
  handleSaveVisit,
  loading
} = useRecordVisit(appointmentId);
```

### Utility Functions

#### `cn(...classNames)`
Combines and merges CSS class names intelligently.
```typescript
cn('px-4 py-2', isActive && 'bg-primary', 'text-white');
```

#### Finance Utilities
```typescript
getStatusBadgeVariant(status);    // Returns badge variant for payment status
getStatusLabel(status);           // Returns human-readable status label
getPaymentMethodDisplay(method);  // Returns formatted payment method name
```

## 🛠️ Troubleshooting

### Common Issues

#### Real-time Updates Not Working
```typescript
// Check subscription setup
useEffect(() => {
  const subscription = supabase
    .channel('unique_channel_name')  // Ensure unique channel names
    .on('postgres_changes', { /* config */ }, callback)
    .subscribe();

  return () => {
    subscription.unsubscribe();      // Always clean up
  };
}, []);
```

#### Authentication Issues
```typescript
// Check user session
const { user, session, loading } = useAuth();

if (loading) return <Loading />;
if (!user) return <LoginPage />;
```

#### Performance Issues
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = memo(({ data }) => {
  // Expensive rendering logic
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

## 📖 Contributing Guidelines

### Code Style
1. Use TypeScript for all new components
2. Follow the established folder structure
3. Write comprehensive JSDoc comments
4. Use semantic HTML and ARIA attributes
5. Follow the design system patterns

### Pull Request Process
1. Create feature branch from `develop`
2. Write tests for new functionality
3. Update documentation
4. Ensure all tests pass
5. Submit PR with detailed description

### Documentation Standards
1. All functions must have JSDoc comments
2. Complex components need architectural documentation
3. Update README.md for new features
4. Include code examples in documentation

## 🔮 Future Enhancements

### Planned Features
1. **Mobile Application**: React Native app for nurses and doctors
2. **Advanced Analytics**: AI-powered insights and predictions
3. **Telemedicine Integration**: Video consultation capabilities
4. **Electronic Health Records**: Comprehensive EHR system
5. **Multi-language Support**: Support for local Nigerian languages

### Technical Improvements
1. **Offline Support**: Progressive Web App capabilities
2. **Advanced Caching**: Redis integration for better performance
3. **Microservices**: Break down into smaller, focused services
4. **Advanced Security**: Two-factor authentication, audit logs
5. **Integration APIs**: Connect with external hospital systems

---

**This documentation is maintained by the NCare Nigeria Development Team. For questions or contributions, please contact the development team through the Lovable platform.**
