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
