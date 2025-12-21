export type Currency = 'BRL' | 'USD' | 'EUR';

export type SplitType = 'EQUAL' | 'PERCENTAGE' | 'EXACT';

export interface Participant {
  id: string;
  name: string;
  email?: string; // Opcional, apenas para identificação visual se quiser
}

export interface ExpenseSplit {
  participantId: string;
  amount: number; // Valor exato que a pessoa deve pagar
  percentage?: number; // Usado se o tipo for PERCENTAGE
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  date: string; // ISO Date string
  category: string;
  payerId: string; // ID de quem pagou
  splitType: SplitType;
  splits: ExpenseSplit[];
  createdAt: number;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  currency: Currency;
  participants: Participant[];
  createdAt: number;
}

export interface Balance {
  participantId: string;
  paid: number; // Total pago pela pessoa
  consumed: number; // Total que a pessoa consumiu
  balance: number; // paid - consumed (positivo = a receber, negativo = a pagar)
}

export interface Debt {
  from: string; // ID de quem deve
  to: string; // ID de quem recebe
  amount: number;
}
