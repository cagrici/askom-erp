// Currency utilities
export * from './currency';

/**
 * Format a date string to localized format
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
};

/**
 * Format a date string to localized date and time format
 * @param dateString Date string to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

/**
 * Format a time string from 24h format to localized time
 * @param timeString Time string to format (HH:MM)
 * @returns Formatted time string
 */
export const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
