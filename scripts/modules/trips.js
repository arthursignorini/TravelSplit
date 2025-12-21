import { tripsStorage, expensesStorage, expenseSplitsStorage } from '../data/storage.js';
import { Trip } from '../data/models.js';

class TripManager {
    constructor() {
        this.trips = tripsStorage.getAll();
    }

    createTrip(tripData) {
        const trip = new Trip(tripData);
        tripsStorage.save(trip);
        this.trips.push(trip);
        return trip;
    }

    updateTrip(id, tripData) {
        const trip = tripsStorage.getById(id);
        if (!trip) return null;

        const updatedTrip = new Trip({
            ...trip,
            ...tripData,
            updatedAt: new Date().toISOString()
        });

        tripsStorage.save(updatedTrip);
        return updatedTrip;
    }

    deleteTrip(id) {
        const success = tripsStorage.delete(id);
        if (!success) return false;

        this.trips = this.trips.filter(trip => trip.id !== id);
        return true;
    }

    getTrip(id) {
        return tripsStorage.getById(id);
    }

    getAllTrips() {
        return this.trips;
    }

    getTripStats(tripId) {
        const trip = this.getTrip(tripId);
        if (!trip) return null;

        const expenses = expensesStorage.filter(expense => expense.tripId === tripId);
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        return {
            trip,
            totalExpenses,
            expenseCount: expenses.length
        };
    }
}

const tripManager = new TripManager();
export default tripManager;