"use client";

// Utility functions for extracting and formatting data from report objects

/**
 * Extracts meaningful values from nested objects commonly found in report data
 * @param {any} value - The value to extract from (could be object, number, string, etc.)
 * @returns {any} - The extracted value
 */
export const extractValue = (value) => {
  if (typeof value === 'object' && value !== null) {
    // Common property names that contain the actual value
    const valueProperties = [
      'score', 'value', 'percentage', 'rating', 'confidence', 
      'average', 'mean', 'result', 'level', 'grade', 'points'
    ];
    
    // Try to find a property that contains the actual value
    for (const prop of valueProperties) {
      if (value[prop] !== undefined && value[prop] !== null) {
        return value[prop];
      }
    }
    
    // Look for any numeric value in the object
    const numericValues = Object.values(value).filter(v => 
      typeof v === 'number' && !isNaN(v) && isFinite(v)
    );
    if (numericValues.length === 1) {
      return numericValues[0];
    }
    
    // If multiple numeric values, try to find the most relevant one
    if (numericValues.length > 1) {
      // Prefer values that are percentages (0-1 or 0-100)
      const percentageValues = numericValues.filter(v => 
        (v >= 0 && v <= 1) || (v >= 0 && v <= 100)
      );
      if (percentageValues.length > 0) {
        return percentageValues[0];
      }
      return numericValues[0];
    }
    
    // Look for text-based feedback
    const textProperties = ['feedback', 'description', 'analysis', 'comment', 'summary'];
    for (const prop of textProperties) {
      if (value[prop] && typeof value[prop] === 'string') {
        return value[prop];
      }
    }
    
    // If it's a simple object with just one property, return that property's value
    const keys = Object.keys(value);
    if (keys.length === 1) {
      return value[keys[0]];
    }
    
    // Return the whole object as a fallback
    return value;
  }
  
  // Validate numeric values
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  }
  
  return value;
};

/**
 * Formats a value for display in the UI
 * @param {any} value - The value to format
 * @param {string} key - The key/property name for context
 * @returns {string} - The formatted display value
 */
export const formatDisplayValue = (value, key = '') => {
  const extractedValue = extractValue(value);
  
  if (typeof extractedValue === 'number') {
    // Check if this should be displayed as a percentage
    const isPercentage = key.toLowerCase().includes('confidence') || 
                        key.toLowerCase().includes('clarity') || 
                        key.toLowerCase().includes('percentage') ||
                        key.toLowerCase().includes('score') ||
                        key.toLowerCase().includes('rate') ||
                        (extractedValue >= 0 && extractedValue <= 1);
    
    if (isPercentage && extractedValue <= 1) {
      return `${Math.round(extractedValue * 100)}%`;
    } else if (isPercentage && extractedValue <= 100) {
      return `${Math.round(extractedValue)}%`;
    } else {
      return Math.round(extractedValue).toString();
    }
  }
  
  if (typeof extractedValue === 'string') {
    return extractedValue;
  }
  
  if (typeof extractedValue === 'object' && extractedValue !== null) {
    // Try to create a readable representation
    if (Array.isArray(extractedValue)) {
      return extractedValue.join(', ');
    }
    
    // For objects, try to extract key information
    const keys = Object.keys(extractedValue);
    if (keys.length <= 3) {
      return Object.entries(extractedValue)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }
    
    return JSON.stringify(extractedValue);
  }
  
  return String(extractedValue);
};

/**
 * Determines if a value should be displayed as a progress bar
 * @param {any} value - The value to check
 * @param {string} key - The key/property name for context
 * @returns {boolean} - Whether this should be a progress bar
 */
export const shouldDisplayAsProgressBar = (value, key = '') => {
  const extractedValue = extractValue(value);
  
  if (typeof extractedValue !== 'number' || isNaN(extractedValue) || !isFinite(extractedValue)) {
    return false;
  }
  
  // Should be progress bar if it's a score, percentage, or confidence value
  return key.toLowerCase().includes('score') ||
         key.toLowerCase().includes('percentage') ||
         key.toLowerCase().includes('confidence') ||
         key.toLowerCase().includes('rate') ||
         key.toLowerCase().includes('level') ||
         (extractedValue >= 0 && extractedValue <= 100);
};

/**
 * Gets the appropriate progress bar value (0-100)
 * @param {any} value - The value to convert
 * @returns {number} - Value normalized to 0-100 range
 */
export const getProgressBarValue = (value) => {
  const extractedValue = extractValue(value);
  
  if (typeof extractedValue !== 'number' || isNaN(extractedValue) || !isFinite(extractedValue)) {
    return 0;
  }
  
  // If value is between 0-1, convert to percentage
  if (extractedValue >= 0 && extractedValue <= 1) {
    return extractedValue * 100;
  }
  
  // If value is already 0-100, use as is
  if (extractedValue >= 0 && extractedValue <= 100) {
    return extractedValue;
  }
  
  // For values outside normal range, normalize to 0-100
  return Math.min(Math.max(extractedValue, 0), 100);
};

/**
 * Extracts detailed information from an object for expanded view
 * @param {any} value - The object to extract details from
 * @returns {string} - Formatted detailed information
 */
export const getDetailedInfo = (value) => {
  if (typeof value === 'object' && value !== null) {
    const details = [];
    
    Object.entries(value).forEach(([key, val]) => {
      if (typeof val === 'string' && val.length > 10) {
        details.push(`${key.replace(/_/g, ' ')}: ${val}`);
      } else if (typeof val === 'number') {
        details.push(`${key.replace(/_/g, ' ')}: ${val}`);
      }
    });
    
    return details.join('\n');
  }
  
  return String(value);
};