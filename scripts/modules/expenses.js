import { expensesStorage, expenseSplitsStorage } from '../data/storage.js';
import { Expense, ExpenseSplit } from '../data/models.js';

class ExpenseManager {
    constructor() {
        this.expenses = expensesStorage.getAll();
    }

    createExpense(expenseData, participantIds = []) {
        const expense = new Expense(expenseData);
        expensesStorage.save(expense);

        // Create equal splits for participants
        if (participantIds.length > 0 && expense.splitType === 'equal') {
            const shareAmount = expense.amount / participantIds.length;
            participantIds.forEach(travelerId => {
                const split = new ExpenseSplit({
                    expenseId: expense.id,
                    travelerId,
                    share: 100 / participantIds.length,
                    actualAmount: shareAmount
                });
                expenseSplitsStorage.save(split);
            });
        }

        this.expenses.push(expense);
        return expense;
    }

    updateExpense(id, expenseData, participantIds = []) {
        const expense = expensesStorage.getById(id);
        if (!expense) return null;

        const updatedExpense = new Expense({
            ...expense,
            ...expenseData,
            updatedAt: new Date().toISOString()
        });

        expensesStorage.save(updatedExpense);

        // Update splits if provided
        if (participantIds.length > 0) {
            // Delete existing splits
            const existingSplits = expenseSplitsStorage.filter(split => split.expenseId === id);
            existingSplits.forEach(split => expenseSplitsStorage.delete(split.id));

            // Create new splits
            if (updatedExpense.splitType === 'equal') {
                const shareAmount = updatedExpense.amount / participantIds.length;
                participantIds.forEach(travelerId => {
                    const split = new ExpenseSplit({
                        expenseId: updatedExpense.id,
                        travelerId,
                        share: 100 / participantIds.length,
                        actualAmount: shareAmount
                    });
                    expenseSplitsStorage.save(split);
                });
            }
        }

        return updatedExpense;
    }

    deleteExpense(id) {
        // Delete expense splits first
        const splits = expenseSplitsStorage.filter(split => split.expenseId === id);
        splits.forEach(split => expenseSplitsStorage.delete(split.id));

        // Delete expense
        const success = expensesStorage.delete(id);
        if (!success) return false;

        this.expenses = this.expenses.filter(expense => expense.id !== id);
        return true;
    }

    getExpense(id) {
        return expensesStorage.getById(id);
    }

    getAllExpenses() {
        return this.expenses;
    }

    getExpensesByTrip(tripId) {
        return this.expenses.filter(expense => expense.tripId === tripId);
    }

    getExpensesByPayer(travelerId) {
        return this.expenses.filter(expense => expense.paidBy === travelerId);
    }

    getExpenseSplits(expenseId) {
        return expenseSplitsStorage.filter(split => split.expenseId === expenseId);
    }
}

const expenseManager = new ExpenseManager();
export default expenseManager;