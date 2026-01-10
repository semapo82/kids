// Date utility functions for weekly period management
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Get the start of the current week (Friday 00:00)
 * Week runs from Friday to Thursday
 */
export function getWeekStart(date = new Date()) {
    // Get Friday of current week
    const friday = startOfWeek(date, { weekStartsOn: 5 }); // 5 = Friday
    return friday;
}

/**
 * Get the end of the current week (Thursday 23:59:59)
 */
export function getWeekEnd(date = new Date()) {
    const thursday = endOfWeek(date, { weekStartsOn: 5 }); // Ends on Thursday
    return thursday;
}

/**
 * Check if a date is within the current week period
 */
export function isCurrentWeek(date) {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(now);

    return isWithinInterval(date, { start: weekStart, end: weekEnd });
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date) {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return date > now;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(d1, d2) {
    const date1 = typeof d1 === 'string' ? parseISO(d1) : d1;
    const date2 = typeof d2 === 'string' ? parseISO(d2) : d2;
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * Get the ISO string of the start of the day
 */
export function startOfDayISO(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

/**
 * Format date for display
 */
export function formatDate(date, formatStr = 'PPp') {
    return format(date, formatStr, { locale: es });
}

/**
 * Get week identifier (e.g., "2026-W01")
 */
export function getWeekIdentifier(date = new Date()) {
    const weekStart = getWeekStart(date);
    return format(weekStart, "'W'II-yyyy");
}

/**
 * Check if we need to reset (new week has started)
 */
export function shouldResetWeek(lastResetDate) {
    if (!lastResetDate) return true;

    const lastReset = typeof lastResetDate === 'string' ? parseISO(lastResetDate) : lastResetDate;
    const lastWeekId = getWeekIdentifier(lastReset);
    const currentWeekId = getWeekIdentifier(new Date());

    return lastWeekId !== currentWeekId;
}
