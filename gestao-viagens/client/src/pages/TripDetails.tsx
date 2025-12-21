import { useState, useMemo } from 'react';
import { useRoute, Link } from 'wouter';
import { useTrips, useExpenses, generateId } from '@/lib/store';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users, 
  Plus, 
  Trash2, 
  Wallet, 
  Receipt, 
  ArrowLeft, 
  Calculator,
  Calendar,
  MapPin,
  CheckCircle2,
  Check
} from 'lucide-react';
import { Participant, Expense, SplitType, ExpenseSplit } from '@/lib/types';
import { calculateBalances, calculateDebts } from '@/lib/finance';

export default function TripDetails() {
  const [match, params] = useRoute('/trip/:id');
  const tripId = params?.id;
  const { trips, updateTrip } = useTrips();
  const { expenses, addExpense, deleteExpense } = useExpenses(tripId);
  
  const trip = trips.find(t => t.id === tripId);
  
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'Alimentação',
    payerId: '',
    splitType: 'EQUAL',
    splits: []
  });
  const [selectedParticipantsForSplit, setSelectedParticipantsForSplit] = useState<string[]>([]);

  // Cálculos financeiros básicos
  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const expensesByPayer = useMemo(() => {
    const acc: Record<string, number> = {};
    expenses.forEach(e => {
      acc[e.payerId] = (acc[e.payerId] || 0) + e.amount;
    });
    return acc;
  }, [expenses]);

  if (!trip) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Viagem não encontrada</h2>
          <Link href="/">
            <Button>Voltar para Início</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleAddParticipant = () => {
    if (!newParticipantName.trim()) {
      alert('Por favor, digite um nome para o participante.');
      return;
    }
    
    const newParticipant: Participant = {
      id: generateId(),
      name: newParticipantName.trim()
    };
    
    updateTrip(trip.id, {
      participants: [...trip.participants, newParticipant]
    });
    
    setNewParticipantName('');
  };

  const handleRemoveParticipant = (participantId: string) => {
    // Verificar se participante tem despesas vinculadas
    const hasExpenses = expenses.some(e => 
      e.payerId === participantId || e.splits.some(s => s.participantId === participantId)
    );
    
    if (hasExpenses) {
      alert('Não é possível remover participante com despesas vinculadas.');
      return;
    }
    
    if (confirm('Remover este participante?')) {
      updateTrip(trip.id, {
        participants: trip.participants.filter(p => p.id !== participantId)
      });
    }
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.payerId) return;
    if (selectedParticipantsForSplit.length === 0) {
      alert('Selecione pelo menos um participante para dividir o gasto.');
      return;
    }
    
    // Gerar splits baseado nos participantes selecionados
    let finalSplits: ExpenseSplit[] = [];
    
    if (newExpense.splitType === 'EQUAL') {
      const splitAmount = Number(newExpense.amount) / selectedParticipantsForSplit.length;
      finalSplits = selectedParticipantsForSplit.map(pId => ({
        participantId: pId,
        amount: splitAmount
      }));
    } else {
      // TODO: Implementar lógica para outros tipos de divisão
      const splitAmount = Number(newExpense.amount) / selectedParticipantsForSplit.length;
      finalSplits = selectedParticipantsForSplit.map(pId => ({
        participantId: pId,
        amount: splitAmount
      }));
    }

    addExpense({
      tripId: trip.id,
      description: newExpense.description!,
      amount: Number(newExpense.amount),
      date: newExpense.date!,
      category: newExpense.category!,
      payerId: newExpense.payerId!,
      splitType: newExpense.splitType as SplitType || 'EQUAL',
      splits: finalSplits
    });
    
    setIsAddExpenseOpen(false);
    setNewExpense({
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: 'Alimentação',
      payerId: '',
      splitType: 'EQUAL',
      splits: []
    });
    setSelectedParticipantsForSplit([]);
  };

  return (
    <Layout 
      title={trip.name}
      action={
        <div className="flex gap-2">
          <Dialog open={isAddParticipantOpen} onOpenChange={setIsAddParticipantOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-2 font-bold">
                <Users className="h-4 w-4 mr-2" />
                Participantes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerenciar Participantes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nome do participante" 
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    className="border-2 border-border"
                  />
                  <Button onClick={handleAddParticipant} className="bg-accent text-accent-foreground font-bold" type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {trip.participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-muted rounded-sm border border-border">
                      <span className="font-mono font-bold">{p.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveParticipant(p.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {trip.participants.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      Nenhum participante adicionado ainda.
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all border-2 border-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Novo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-2 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <DialogHeader>
                <DialogTitle className="uppercase font-bold text-xl">Registrar Despesa</DialogTitle>
              </DialogHeader>
              
              {trip.participants.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">Adicione participantes antes de registrar gastos.</p>
                  <Button onClick={() => {setIsAddExpenseOpen(false); setIsAddParticipantOpen(true);}}>
                    Adicionar Participantes
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="desc" className="font-mono uppercase text-xs">Descrição</Label>
                    <Input 
                      id="desc" 
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      placeholder="Ex: Jantar no restaurante"
                      className="border-2 border-border font-bold"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount" className="font-mono uppercase text-xs">Valor ({trip.currency})</Label>
                      <Input 
                        id="amount" 
                        type="number"
                        step="0.01"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                        className="border-2 border-border font-mono"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date" className="font-mono uppercase text-xs">Data</Label>
                      <Input 
                        id="date" 
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                        className="border-2 border-border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="payer" className="font-mono uppercase text-xs">Quem pagou?</Label>
                      <Select 
                        value={newExpense.payerId} 
                        onValueChange={(v) => setNewExpense({...newExpense, payerId: v})}
                      >
                        <SelectTrigger className="border-2 border-border">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {trip.participants.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category" className="font-mono uppercase text-xs">Categoria</Label>
                      <Select 
                        value={newExpense.category} 
                        onValueChange={(v) => setNewExpense({...newExpense, category: v})}
                      >
                        <SelectTrigger className="border-2 border-border">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alimentação">Alimentação</SelectItem>
                          <SelectItem value="Transporte">Transporte</SelectItem>
                          <SelectItem value="Hospedagem">Hospedagem</SelectItem>
                          <SelectItem value="Lazer">Lazer</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="font-mono uppercase text-xs">Dividir com quem?</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto border border-border rounded-sm p-3 bg-muted/30">
                      {trip.participants.map(p => (
                        <div key={p.id} className="flex items-center gap-2">
                          <Checkbox 
                            id={`participant-${p.id}`}
                            checked={selectedParticipantsForSplit.includes(p.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedParticipantsForSplit([...selectedParticipantsForSplit, p.id]);
                              } else {
                                setSelectedParticipantsForSplit(selectedParticipantsForSplit.filter(id => id !== p.id));
                              }
                            }}
                          />
                          <Label htmlFor={`participant-${p.id}`} className="font-mono font-bold cursor-pointer">
                            {p.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-sm border border-border text-xs text-muted-foreground">
                    <p>O valor será dividido igualmente entre os participantes selecionados.</p>
                  </div>
                </div>
              )}
              
              {trip.participants.length > 0 && (
                <DialogFooter>
                  <Button onClick={handleAddExpense} className="w-full bg-primary text-primary-foreground font-bold border-2 border-transparent hover:border-primary hover:bg-transparent hover:text-primary transition-all">
                    SALVAR DESPESA
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda: Resumo e Participantes */}
        <div className="space-y-6">
          <Card className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-muted/30 border-b-2 border-border pb-4">
              <CardTitle className="text-lg uppercase font-bold flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Detalhes da Viagem
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-mono uppercase">Destino</span>
                <span className="font-bold">{trip.destination}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-mono uppercase">Data</span>
                <span className="font-bold text-sm">
                  {format(new Date(trip.startDate), 'dd/MM/yy')} - {format(new Date(trip.endDate), 'dd/MM/yy')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-mono uppercase">Status</span>
                <Badge variant="outline" className="bg-primary text-primary-foreground border-transparent">
                  {trip.status}
                </Badge>
              </div>
              
              <div className="border-t-2 border-dashed border-border my-4 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground text-sm font-mono uppercase">Total Gasto</span>
                  <span className="font-mono font-bold text-xl text-accent">
                    {trip.currency} {totalExpenses.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-muted/30 border-b-2 border-border pb-4">
              <CardTitle className="text-lg uppercase font-bold flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Quem Pagou O Quê
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {trip.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem participantes.</p>
              ) : (
                <div className="space-y-3">
                  {trip.participants.map(p => (
                    <div key={p.id} className="flex justify-between items-center">
                      <span className="font-medium">{p.name}</span>
                      <span className="font-mono text-sm">
                        {trip.currency} {(expensesByPayer[p.id] || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Lista de Gastos */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="expenses" className="w-full">
            <TabsList className="w-full justify-start border-b-2 border-border rounded-none bg-transparent p-0 h-auto gap-6">
              <TabsTrigger 
                value="expenses" 
                className="rounded-none border-b-4 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-bold uppercase text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Extrato de Gastos
              </TabsTrigger>
              <TabsTrigger 
                value="balances" 
                className="rounded-none border-b-4 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-bold uppercase text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Acerto de Contas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="expenses" className="mt-6">
              {expenses.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/10">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-xl font-bold mb-2">Nenhum gasto registrado</h3>
                  <p className="text-muted-foreground mb-6">Comece adicionando as despesas da viagem.</p>
                  <Button onClick={() => setIsAddExpenseOpen(true)} className="bg-accent text-accent-foreground font-bold">
                    Adicionar Primeiro Gasto
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense) => {
                    const payer = trip.participants.find(p => p.id === expense.payerId);
                    return (
                      <div key={expense.id} className="group flex items-center justify-between p-4 bg-card border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all">
                        <div className="flex items-start gap-4">
                          <div className="bg-primary/10 p-2 rounded-sm text-primary">
                            {expense.category === 'Alimentação' && <span className="text-xl">🍽️</span>}
                            {expense.category === 'Transporte' && <span className="text-xl">🚕</span>}
                            {expense.category === 'Hospedagem' && <span className="text-xl">🏨</span>}
                            {expense.category === 'Lazer' && <span className="text-xl">🎟️</span>}
                            {expense.category === 'Outros' && <span className="text-xl">📝</span>}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg leading-none mb-1">{expense.description}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-mono">{format(new Date(expense.date), 'dd/MM')}</span>
                              <span>•</span>
                              <span>Pago por <strong className="text-foreground">{payer?.name || 'Desconhecido'}</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-lg">
                            {trip.currency} {expense.amount.toFixed(2)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteExpense(expense.id)}
                            className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="balances" className="mt-6">
              {expenses.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/10">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-xl font-bold mb-2">Sem dados suficientes</h3>
                  <p className="text-muted-foreground mb-6">Adicione gastos para calcular os acertos.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {/* Resumo de Saldos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calculateBalances(expenses, trip.participants).map(balance => {
                      const participant = trip.participants.find(p => p.id === balance.participantId);
                      const isCreditor = balance.balance > 0;
                      const isDebtor = balance.balance < 0;
                      
                      return (
                        <Card key={balance.participantId} className={`border-2 ${isCreditor ? 'border-primary/50 bg-primary/5' : isDebtor ? 'border-accent/50 bg-accent/5' : 'border-border'} shadow-sm`}>
                          <CardContent className="p-4 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-lg">{participant?.name}</p>
                              <div className="text-xs text-muted-foreground font-mono mt-1">
                                Pagou: {trip.currency} {balance.paid.toFixed(2)} • Consumiu: {trip.currency} {balance.consumed.toFixed(2)}
                              </div>
                            </div>
                            <div className={`text-xl font-mono font-bold ${isCreditor ? 'text-primary' : isDebtor ? 'text-accent' : 'text-muted-foreground'}`}>
                              {balance.balance > 0 ? '+' : ''}{balance.balance.toFixed(2)}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Plano de Pagamentos Otimizado */}
                  <div className="mt-4">
                    <h3 className="text-lg font-bold uppercase mb-4 flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
                      Plano de Acertos Otimizado
                    </h3>
                    
                    {calculateDebts(calculateBalances(expenses, trip.participants)).length === 0 ? (
                      <div className="p-4 bg-muted border border-border rounded-sm text-center">
                        <p className="font-bold text-primary">Tudo quitado! Ninguém deve nada a ninguém. 🎉</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {calculateDebts(calculateBalances(expenses, trip.participants)).map((debt, index) => {
                          const from = trip.participants.find(p => p.id === debt.from);
                          const to = trip.participants.find(p => p.id === debt.to);
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-4 bg-card border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <div className="flex items-center gap-3">
                                <div className="font-bold text-accent">{from?.name}</div>
                                <div className="text-muted-foreground text-sm uppercase font-mono">deve pagar para</div>
                                <div className="font-bold text-primary">{to?.name}</div>
                              </div>
                              <div className="font-mono font-bold text-xl bg-muted px-3 py-1 rounded-sm border border-border">
                                {trip.currency} {debt.amount.toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
