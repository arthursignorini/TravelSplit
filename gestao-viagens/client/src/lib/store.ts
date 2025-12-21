import { useState, useEffect } from 'react';
import { Trip, Expense } from './types';

const STORAGE_KEYS = {
  TRIPS: 'gestao_viagens_trips',
  EXPENSES: 'gestao_viagens_expenses',
};

// Helper para gerar IDs únicos
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Hook para gerenciar viagens
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.TRIPS);
    if (stored) {
      setTrips(JSON.parse(stored));
    }
  }, []);

  const saveTrips = (newTrips: Trip[]) => {
    setTrips(newTrips);
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(newTrips));
  };

  const addTrip = (trip: Omit<Trip, 'id' | 'createdAt'>) => {
    const newTrip: Trip = {
      ...trip,
      id: generateId(),
      createdAt: Date.now(),
    };
    saveTrips([...trips, newTrip]);
    return newTrip;
  };

  const updateTrip = (id: string, updates: Partial<Trip>) => {
    const newTrips = trips.map((t) => (t.id === id ? { ...t, ...updates } : t));
    saveTrips(newTrips);
  };

  const deleteTrip = (id: string) => {
    const newTrips = trips.filter((t) => t.id !== id);
    saveTrips(newTrips);
    // Também remover despesas associadas
    const allExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
    const newExpenses = allExpenses.filter((e: Expense) => e.tripId !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(newExpenses));
  };

  return { trips, addTrip, updateTrip, deleteTrip };
}

// Hook para gerenciar despesas
export function useExpenses(tripId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (stored) {
      const allExpenses: Expense[] = JSON.parse(stored);
      if (tripId) {
        setExpenses(allExpenses.filter((e) => e.tripId === tripId));
      } else {
        setExpenses(allExpenses);
      }
    }
  }, [tripId]);

  const saveExpenses = (newExpenses: Expense[]) => {
    // Se estamos filtrando por tripId, precisamos mesclar com as outras despesas antes de salvar
    const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const allStoredExpenses: Expense[] = stored ? JSON.parse(stored) : [];
    
    let finalExpenses: Expense[];
    
    if (tripId) {
      const otherExpenses = allStoredExpenses.filter(e => e.tripId !== tripId);
      finalExpenses = [...otherExpenses, ...newExpenses];
    } else {
      finalExpenses = newExpenses;
    }

    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(finalExpenses));
    setExpenses(tripId ? finalExpenses.filter(e => e.tripId === tripId) : finalExpenses);
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      createdAt: Date.now(),
    };
    // Recarrega do storage para garantir que temos a versão mais recente
    const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const allStoredExpenses: Expense[] = stored ? JSON.parse(stored) : [];
    const updatedAll = [...allStoredExpenses, newExpense];
    
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedAll));
    
    if (tripId && expense.tripId === tripId) {
      setExpenses(prev => [...prev, newExpense]);
    } else if (!tripId) {
      setExpenses(updatedAll);
    }
    return newExpense;
  };

  const deleteExpense = (id: string) => {
    const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const allStoredExpenses: Expense[] = stored ? JSON.parse(stored) : [];
    const updatedAll = allStoredExpenses.filter(e => e.id !== id);
    
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedAll));
    
    if (tripId) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    } else {
      setExpenses(updatedAll);
    }
  };

  return { expenses, addExpense, deleteExpense };
}
