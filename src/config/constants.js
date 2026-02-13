/**
 * Keka Pro Extension - Configuration Constants
 * 
 * This file contains all centralized configuration values for the extension.
 * Modify these values to customize the extension behavior for your organization.
 */

/**
 * WORK HOURS POLICY
 * 
 * Define the number of EFFECTIVE work hours required per day.
 * This is used for:
 * - Auto clock-out scheduling (clocks out after completing required effective hours)
 * - Early clock-out reminders (reminds if you clock out before completing required hours)
 * - "8 Hours At" calculation display on attendance page
 * 
 * IMPORTANT: This refers to EFFECTIVE hours (actual work time), NOT gross hours.
 * Effective hours = Gross hours - Break time
 * 
 * Common values:
 * - 8 hours = 480 minutes (most common)
 * - 9 hours = 540 minutes
 * - 7.5 hours = 450 minutes
 * - 10 hours = 600 minutes
 * 
 * TO CHANGE: Simply update the REQUIRED_WORK_HOURS value below
 */

// ============================================================================
// MAIN CONFIGURATION - CHANGE THIS VALUE TO SET YOUR WORK HOURS POLICY
// ============================================================================

/**
 * Required effective work hours per day (in hours)
 * @type {number}
 * @default 8
 */
export const REQUIRED_WORK_HOURS = 8;

// ============================================================================
// DERIVED VALUES - DO NOT MODIFY (automatically calculated from above)
// ============================================================================

/**
 * Required effective work time in minutes
 * Automatically calculated from REQUIRED_WORK_HOURS
 * @type {number}
 */
export const REQUIRED_WORK_MINUTES = REQUIRED_WORK_HOURS * 60;

/**
 * Display label for work hours (e.g., "8 Hours At:")
 * @type {string}
 */
export const WORK_HOURS_LABEL = `${REQUIRED_WORK_HOURS} Hours At:`;

// ============================================================================
// OTHER CONFIGURATION OPTIONS
// ============================================================================

/**
 * Auto clock-out buffer time (in minutes)
 * Adds extra time after required hours are completed before auto clock-out
 * @type {number}
 * @default 1
 */
export const AUTO_CLOCKOUT_BUFFER_MINUTES = 1;

/**
 * Early clock-out reminder interval (in minutes)
 * How often to remind user if they clock out before completing required hours
 * @type {number}
 * @default 3
 */
export const EARLY_CLOCKOUT_REMINDER_INTERVAL = 3;

/**
 * Regular clock-out reminder interval (in minutes)
 * How often to remind user to clock in when they are clocked out
 * @type {number}
 * @default 2
 */
export const REGULAR_CLOCKOUT_REMINDER_INTERVAL = 2;

// ============================================================================
// EXPORT ALL CONSTANTS
// ============================================================================

export default {
    REQUIRED_WORK_HOURS,
    REQUIRED_WORK_MINUTES,
    WORK_HOURS_LABEL,
    AUTO_CLOCKOUT_BUFFER_MINUTES,
    EARLY_CLOCKOUT_REMINDER_INTERVAL,
    REGULAR_CLOCKOUT_REMINDER_INTERVAL
};
