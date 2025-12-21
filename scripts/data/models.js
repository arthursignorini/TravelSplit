// Schema definitions for all entities

const Currency = {
    BRL: 'BRL',
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP'
};

const TripStatus = {
    PLANNING: 'planning',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const SplitType = {
    EQUAL: 'equal',
    PERCENTAGE: 'percentage',
    FIXED: 'fixed'
};

// Trip entity
class Trip {
    constructor(data = {}) {
        this.id = data.id || crypto.randomUUID();
        this.name = data.name || '';
        this.destination = data.destination || '';
        this.description = data.description || '';
        this.startDate = data.startDate || null;
        this.endDate = data.endDate || null;
        this.currency = data.currency || Currency.BRL;
        this.status = data.status || TripStatus.PLANNING;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }
}

// Traveler entity
class Traveler {
    constructor(data = {}) {
        this.id = data.id || crypto.randomUUID();
        this.name = data.name || '';
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.color = data.color || this.generateRandomColor();
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    generateRandomColor() {
        const colors = [
            '#4361ee', '#7209b7', '#f72585', '#4cc9f0',
            '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Expense entity
class Expense {
    constructor(data = {}) {
        this.id = data.id || crypto.randomUUID();
        this.tripId = data.tripId || '';
        this.description = data.description || '';
        this.amount = data.amount || 0;
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.category = data.category || 'other';
        this.paidBy = data.paidBy || '';
        this.splitType = data.splitType || SplitType.EQUAL;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }
}

// ExpenseSplit entity
class ExpenseSplit {
    constructor(data = {}) {
        this.id = data.id || crypto.randomUUID();
        this.expenseId = data.expenseId || '';
        this.travelerId = data.travelerId || '';
        this.share = data.share || 0;
        this.actualAmount = data.actualAmount || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
    }
}

// Settlement entity
class Settlement {
    constructor(data = {}) {
        this.id = data.id || crypto.randomUUID();
        this.tripId = data.tripId || '';
        this.fromTravelerId = data.fromTravelerId || '';
        this.toTravelerId = data.toTravelerId || '';
        this.amount = data.amount || 0;
        this.currency = data.currency || Currency.BRL;
        this.isPaid = data.isPaid || false;
        this.paidAt = data.paidAt || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }
}

export {
    Trip,
    Traveler,
    Expense,
    ExpenseSplit,
    Settlement,
    Currency,
    TripStatus,
    SplitType
};