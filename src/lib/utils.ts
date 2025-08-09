/**
 * Utility Functions for NCare Nigeria Hospital Management System
 * 
 * Common utility functions used throughout the application.
 * This file contains helper functions for styling, data manipulation, and other common operations.
 * 
 * @author NCare Nigeria Development Team
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges CSS class names intelligently
 * 
 * This function combines multiple class names and resolves conflicts
 * using Tailwind CSS's merge functionality. It's essential for our
 * design system to work properly with conditional styling.
 * 
 * @param inputs - Array of class names (strings, conditionals, etc.)
 * @returns Merged and deduplicated class name string
 * 
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', 'text-white')
 * // Returns: 'px-4 py-2 bg-primary text-white'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
