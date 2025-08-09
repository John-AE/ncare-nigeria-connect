/**
 * Finance Utility Functions
 * 
 * Helper functions for financial operations and display formatting.
 * These utilities standardize how financial data is presented across
 * the application and ensure consistent user experience.
 * 
 * @author NCare Nigeria Development Team
 */

/**
 * Determines the appropriate badge variant for a payment status
 * 
 * Maps payment status to UI badge variants for consistent visual representation.
 * Used throughout the finance dashboard and billing components.
 * 
 * @param status - Payment status from database ('fully_paid', 'partially_paid', 'unpaid')
 * @returns Badge variant string for UI components
 */
export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'fully_paid': return 'default';      // Green badge for completed payments
    case 'partially_paid': return 'secondary'; // Blue badge for partial payments
    case 'unpaid': return 'destructive';       // Red badge for unpaid bills
    default: return 'outline';                 // Gray outline for unknown status
  }
};

/**
 * Converts payment status codes to human-readable labels
 * 
 * Transforms database status codes into user-friendly display text.
 * 
 * @param status - Payment status code from database
 * @returns Human-readable status label
 */
export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'fully_paid': return 'Fully Paid';
    case 'partially_paid': return 'Partially Paid';
    case 'unpaid': return 'Unpaid';
    default: return 'Unknown';
  }
};

/**
 * Formats payment method codes for display
 * 
 * Converts payment method identifiers to display-friendly names.
 * Supports Nigerian payment methods commonly used in healthcare.
 * 
 * @param method - Payment method code from database
 * @returns Formatted payment method name
 */
export const getPaymentMethodDisplay = (method: string) => {
  switch (method) {
    case 'cash': return 'Cash';
    case 'debit_card': return 'Debit Card';
    case 'bank_transfer': return 'Bank Transfer';
    case 'credit_card': return 'Credit Card';
    case 'mobile_money': return 'Mobile Money';
    default: return method || 'N/A';
  }
};