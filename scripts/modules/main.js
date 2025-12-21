// scripts/modules/main.js
import { Trip, Traveler, Expense, ExpenseSplit, Settlement, Currency, TripStatus, SplitType, ExpenseCategories } from '../data/models.js';
import { tripsStorage, travelersStorage, expensesStorage, expenseSplitsStorage, settlementsStorage, exportAllData, importAllData, clearAllData, getStorageStats } from '../data/storage.js';
import { formatCurrency, formatDate, formatDateForInput, getDaysBetween, deepClone, isValidEmail, isValidPhone, debounce, throttle, getCategoryName, getCategoryIcon, calculateAge, generateId, sleep, parseFloatSafe, getInitials, createDataURL, downloadFile } from '../data/helpers.js';

// Export all modules
export {
    // Models
    Trip, Traveler, Expense, ExpenseSplit, Settlement,
    Currency, TripStatus, SplitType, ExpenseCategories,
    
    // Storage
    tripsStorage, travelersStorage, expensesStorage, 
    expenseSplitsStorage, settlementsStorage,
    exportAllData, importAllData, clearAllData, getStorageStats,
    
    // Helpers
    formatCurrency, formatDate, formatDateForInput, getDaysBetween,
    deepClone, isValidEmail, isValidPhone, debounce, throttle,
    getCategoryName, getCategoryIcon, calculateAge, generateId,
    sleep, parseFloatSafe, getInitials, createDataURL, downloadFile
};