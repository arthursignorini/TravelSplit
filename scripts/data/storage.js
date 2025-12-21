// Storage keys
const STORAGE_KEYS = {
    TRIPS: '@trips',
    TRAVELERS: '@travelers',
    EXPENSES: '@expenses',
    EXPENSE_SPLITS: '@expenseSplits',
    SETTLEMENTS: '@settlements'
};

// Initialize storage with empty arrays if not exists
function initializeStorage() {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach(key => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify([]));
        }
    });
}

// Generic storage operations
class StorageService {
    constructor(key, EntityClass) {
        this.key = key;
        this.EntityClass = EntityClass;
    }

    getAll() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data).map(item => new this.EntityClass(item)) : [];
        } catch (error) {
            console.error(`Error reading ${this.key}:`, error);
            return [];
        }
    }

    getById(id) {
        const items = this.getAll();
        return items.find(item => item.id === id);
    }

    save(item) {
        const items = this.getAll();
        const index = items.findIndex(i => i.id === item.id);
        
        if (index >= 0) {
            // Update
            items[index] = item;
        } else {
            // Create
            items.push(item);
        }
        
        localStorage.setItem(this.key, JSON.stringify(items));
        return item;
    }

    delete(id) {
        const items = this.getAll();
        const filteredItems = items.filter(item => item.id !== id);
        localStorage.setItem(this.key, JSON.stringify(filteredItems));
        return true;
    }

    filter(predicate) {
        const items = this.getAll();
        return items.filter(predicate);
    }

    clear() {
        localStorage.setItem(this.key, JSON.stringify([]));
    }
}

// Create storage service instances
const tripsStorage = new StorageService(STORAGE_KEYS.TRIPS, Object);
const travelersStorage = new StorageService(STORAGE_KEYS.TRAVELERS, Object);
const expensesStorage = new StorageService(STORAGE_KEYS.EXPENSES, Object);
const expenseSplitsStorage = new StorageService(STORAGE_KEYS.EXPENSE_SPLITS, Object);
const settlementsStorage = new StorageService(STORAGE_KEYS.SETTLEMENTS, Object);

// Get all data for export
function exportAllData() {
    return {
        trips: tripsStorage.getAll(),
        travelers: travelersStorage.getAll(),
        expenses: expensesStorage.getAll(),
        expenseSplits: expenseSplitsStorage.getAll(),
        settlements: settlementsStorage.getAll(),
        exportedAt: new Date().toISOString()
    };
}

// Import all data
function importAllData(data) {
    try {
        // Clear existing data
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.setItem(key, JSON.stringify([]));
        });

        // Import each collection
        data.trips?.forEach(trip => tripsStorage.save(trip));
        data.travelers?.forEach(traveler => travelersStorage.save(traveler));
        data.expenses?.forEach(expense => expensesStorage.save(expense));
        data.expenseSplits?.forEach(split => expenseSplitsStorage.save(split));
        data.settlements?.forEach(settlement => settlementsStorage.save(settlement));

        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        return false;
    }
}

// Clear all data
function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.setItem(key, JSON.stringify([]));
    });
}

// Get storage statistics
function getStorageStats() {
    const stats = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        const data = localStorage.getItem(key);
        const items = data ? JSON.parse(data) : [];
        stats[name] = items.length;
    });
    return stats;
}

// Initialize storage on load
initializeStorage();

export {
    tripsStorage,
    travelersStorage,
    expensesStorage,
    expenseSplitsStorage,
    settlementsStorage,
    exportAllData,
    importAllData,
    clearAllData,
    getStorageStats,
    STORAGE_KEYS
};