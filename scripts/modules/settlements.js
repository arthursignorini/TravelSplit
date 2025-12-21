import { tripsStorage, travelersStorage, expensesStorage, expenseSplitsStorage, settlementsStorage } from '../data/storage.js';
import { Settlement } from '../data/models.js';

class SettlementManager {
    constructor() {
        this.settlements = settlementsStorage.getAll();
    }

    calculateBalances(tripId) {
        const trip = tripsStorage.getById(tripId);
        if (!trip) return null;

        const travelers = travelersStorage.getAll();
        const expenses = expensesStorage.filter(expense => expense.tripId === tripId);
        const expenseSplits = expenseSplitsStorage.getAll();

        // Initialize balances
        const balances = travelers.map(traveler => ({
            traveler,
            paid: 0,
            consumed: 0,
            balance: 0
        }));

        // Calculate paid amounts
        expenses.forEach(expense => {
            const balance = balances.find(b => b.traveler.id === expense.paidBy);
            if (balance) {
                balance.paid += expense.amount;
            }
        });

        // Calculate consumed amounts
        expenseSplits.forEach(split => {
            const expense = expensesStorage.getById(split.expenseId);
            if (expense && expense.tripId === tripId) {
                const balance = balances.find(b => b.traveler.id === split.travelerId);
                if (balance) {
                    balance.consumed += split.actualAmount;
                }
            }
        });

        // Calculate final balances
        balances.forEach(balance => {
            balance.balance = balance.paid - balance.consumed;
        });

        return {
            trip,
            balances,
            currency: trip.currency
        };
    }

    generateSettlements(tripId) {
        const balances = this.calculateBalances(tripId);
        if (!balances) return [];

        const creditors = balances.balances.filter(b => b.balance > 0);
        const debtors = balances.balances.filter(b => b.balance < 0);

        const settlements = [];
        let i = 0, j = 0;

        while (i < creditors.length && j < debtors.length) {
            const creditor = creditors[i];
            const debtor = debtors[j];
            
            const creditorBalance = creditor.balance;
            const debtorBalance = Math.abs(debtor.balance);
            
            const amount = Math.min(creditorBalance, debtorBalance);
            
            if (amount > 0.01) {
                settlements.push({
                    fromTravelerId: debtor.traveler.id,
                    toTravelerId: creditor.traveler.id,
                    amount: parseFloat(amount.toFixed(2)),
                    currency: balances.currency
                });
                
                creditor.balance -= amount;
                debtor.balance += amount;
            }
            
            if (creditor.balance < 0.01) i++;
            if (Math.abs(debtor.balance) < 0.01) j++;
        }

        return settlements;
    }

    saveSettlements(tripId, settlements) {
        // Delete existing settlements for this trip
        const existingSettlements = settlementsStorage.filter(s => s.tripId === tripId);
        existingSettlements.forEach(s => settlementsStorage.delete(s.id));

        // Save new settlements
        const savedSettlements = settlements.map(settlement => {
            const s = new Settlement({
                tripId,
                ...settlement,
                isPaid: false
            });
            settlementsStorage.save(s);
            return s;
        });

        this.settlements = settlementsStorage.getAll();
        return savedSettlements;
    }
}

const settlementManager = new SettlementManager();
export default settlementManager;