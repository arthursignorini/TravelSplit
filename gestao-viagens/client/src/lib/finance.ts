import { Expense, Participant, Balance, Debt } from './types';

/**
 * Calcula o saldo de cada participante (quanto pagou vs quanto consumiu)
 */
export function calculateBalances(expenses: Expense[], participants: Participant[]): Balance[] {
  const balances: Record<string, Balance> = {};

  // Inicializa saldos zerados para todos os participantes
  participants.forEach(p => {
    balances[p.id] = {
      participantId: p.id,
      paid: 0,
      consumed: 0,
      balance: 0
    };
  });

  expenses.forEach(expense => {
    // Adiciona ao total pago por quem pagou
    if (balances[expense.payerId]) {
      balances[expense.payerId].paid += expense.amount;
    }

    // Adiciona ao total consumido por cada participante envolvido na divisão
    expense.splits.forEach(split => {
      if (balances[split.participantId]) {
        balances[split.participantId].consumed += split.amount;
      }
    });
  });

  // Calcula o saldo final (paid - consumed)
  return Object.values(balances).map(b => ({
    ...b,
    balance: b.paid - b.consumed
  }));
}

/**
 * Algoritmo para minimizar o número de transferências necessárias para quitar as dívidas
 * Baseado em um algoritmo guloso (greedy) que casa os maiores credores com os maiores devedores
 */
export function calculateDebts(balances: Balance[]): Debt[] {
  const debts: Debt[] = [];
  
  // Separa devedores (saldo negativo) e credores (saldo positivo)
  // Ignora saldos muito próximos de zero para evitar problemas de ponto flutuante
  let debtors = balances
    .filter(b => b.balance < -0.01)
    .sort((a, b) => a.balance - b.balance); // Ordena do mais negativo para o menos negativo

  let creditors = balances
    .filter(b => b.balance > 0.01)
    .sort((a, b) => b.balance - a.balance); // Ordena do mais positivo para o menos positivo

  // Enquanto houver devedores e credores
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    // O valor a ser transferido é o mínimo entre o que o devedor deve e o que o credor tem a receber
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

    // Registra a dívida
    debts.push({
      from: debtor.participantId,
      to: creditor.participantId,
      amount: Number(amount.toFixed(2))
    });

    // Atualiza os saldos temporários
    debtor.balance += amount;
    creditor.balance -= amount;

    // Se o devedor pagou tudo, passa para o próximo
    if (Math.abs(debtor.balance) < 0.01) {
      debtorIndex++;
    }

    // Se o credor recebeu tudo, passa para o próximo
    if (creditor.balance < 0.01) {
      creditorIndex++;
    }
  }

  return debts;
}
