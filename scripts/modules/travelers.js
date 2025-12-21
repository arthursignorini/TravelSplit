import { travelersStorage } from '../data/storage.js';
import { Traveler } from '../data/models.js';

class TravelerManager {
    constructor() {
        this.travelers = travelersStorage.getAll();
    }

    createTraveler(travelerData) {
        const traveler = new Traveler(travelerData);
        travelersStorage.save(traveler);
        this.travelers.push(traveler);
        return traveler;
    }

    updateTraveler(id, travelerData) {
        const traveler = travelersStorage.getById(id);
        if (!traveler) return null;

        const updatedTraveler = new Traveler({
            ...traveler,
            ...travelerData,
            updatedAt: new Date().toISOString()
        });

        travelersStorage.save(updatedTraveler);
        return updatedTraveler;
    }

    deleteTraveler(id) {
        const success = travelersStorage.delete(id);
        if (!success) return false;

        this.travelers = this.travelers.filter(traveler => traveler.id !== id);
        return true;
    }

    getTraveler(id) {
        return travelersStorage.getById(id);
    }

    getAllTravelers() {
        return this.travelers;
    }
}

const travelerManager = new TravelerManager();
export default travelerManager;