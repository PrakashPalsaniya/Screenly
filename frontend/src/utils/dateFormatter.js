import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Extend dayjs with customParseFormat plugin
dayjs.extend(customParseFormat);

/**
 * Format a date string from DD-MM-YYYY format
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @param {string} format - Target format (default: "D MMMM YYYY")
 * @returns {string} Formatted date or "Invalid Date" if parsing fails
 */
export const formatShowDate = (dateString, format = "D MMMM YYYY") => {
  if (!dateString) return "";
  const parsed = dayjs(dateString, "DD-MM-YYYY");
  return parsed.isValid() ? parsed.format(format) : "Invalid Date";
};

/**
 * Format show date and time for display
 * @param {string} date - Date string in DD-MM-YYYY format
 * @param {string} time - Time string (e.g., "18:30")
 * @returns {string} Formatted string like "25 April · 6:30 PM"
 */
export const formatShowDateTime = (date, time) => {
  const formattedDate = formatShowDate(date, "D MMMM");
  return time ? `${formattedDate} · ${time}` : formattedDate;
};

/**
 * Format show date in short format
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {string} Formatted date like "25 Apr"
 */
export const formatShowDateShort = (dateString) => {
  return formatShowDate(dateString, "D MMM");
};

/**
 * Format show date with year
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {string} Formatted date like "25 Apr 26"
 */
export const formatShowDateWithYear = (dateString) => {
  return formatShowDate(dateString, "D MMM YY");
};

/**
 * Get day of week from date string
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {string} Day name like "Mon", "Tue", etc.
 */
export const getShowDay = (dateString) => {
  return formatShowDate(dateString, "ddd");
};

export default dayjs;
