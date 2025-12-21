import { useState } from 'react';
import { Link } from 'wouter';
import { Plus, Calendar, MapPin, Users, ArrowRight, Trash2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTrips } from '@/lib/store';
import { Trip, Currency } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Home() {
  const { trips, addTrip, deleteTrip } = useTrips();
  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    currency: 'BRL',
    status: 'PLANNED',
    participants: []
  });

  const handleCreateTrip = () => {
    if (!newTrip.name || !newTrip.destination) return;
    
    addTrip({
      name: newTrip.name!,
      destination: newTrip.destination!,
      startDate: newTrip.startDate || new Date().toISOString(),
      endDate: newTrip.endDate || new Date().toISOString(),
      currency: newTrip.currency as Currency || 'BRL',
      status: 'PLANNED',
      participants: []
    });
    
    setIsNewTripOpen(false);
    setNewTrip({ name: '', destination: '', currency: 'BRL', status: 'PLANNED' });
  };

  return (
    <Layout 
      title="Minhas Viagens"
      action={
        <Dialog open={isNewTripOpen} onOpenChange={setIsNewTripOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 border-2 border-transparent font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
              <Plus className="h-5 w-5 mr-2" />
              Nova Viagem
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Nova Aventura</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="font-mono uppercase text-xs">Nome da Viagem</Label>
                <Input 
                  id="name" 
                  value={newTrip.name} 
                  onChange={(e) => setNewTrip({...newTrip, name: e.target.value})}
                  className="border-2 border-border focus-visible:ring-accent font-bold"
                  placeholder="Ex: Mochilão Europa"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destination" className="font-mono uppercase text-xs">Destino</Label>
                <Input 
                  id="destination" 
                  value={newTrip.destination} 
                  onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                  className="border-2 border-border focus-visible:ring-accent"
                  placeholder="Ex: Paris, França"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start" className="font-mono uppercase text-xs">Início</Label>
                  <Input 
                    id="start" 
                    type="date"
                    value={newTrip.startDate} 
                    onChange={(e) => setNewTrip({...newTrip, startDate: e.target.value})}
                    className="border-2 border-border focus-visible:ring-accent"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end" className="font-mono uppercase text-xs">Fim</Label>
                  <Input 
                    id="end" 
                    type="date"
                    value={newTrip.endDate} 
                    onChange={(e) => setNewTrip({...newTrip, endDate: e.target.value})}
                    className="border-2 border-border focus-visible:ring-accent"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency" className="font-mono uppercase text-xs">Moeda Principal</Label>
                <Select 
                  value={newTrip.currency} 
                  onValueChange={(v) => setNewTrip({...newTrip, currency: v as Currency})}
                >
                  <SelectTrigger className="border-2 border-border focus:ring-accent">
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-border">
                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTrip} className="w-full bg-primary text-primary-foreground font-bold border-2 border-transparent hover:border-primary hover:bg-transparent hover:text-primary transition-all">
                CRIAR VIAGEM
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-lg bg-muted/10">
          <div className="bg-muted rounded-full p-6 mb-4">
            <Plane className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Nenhuma viagem encontrada</h3>
          <p className="text-muted-foreground max-w-md mb-8">
            Comece sua próxima aventura criando uma nova viagem para gerenciar gastos e participantes.
          </p>
          <Button 
            onClick={() => setIsNewTripOpen(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Viagem
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trip/${trip.id}`} className="block group h-full">
              <Card className="h-full border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 bg-card relative overflow-hidden">
                {/* Faixa decorativa lateral */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary group-hover:bg-accent transition-colors" />
                
                <CardHeader className="pl-6 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-muted text-muted-foreground text-[10px] font-mono uppercase px-2 py-1 border border-border rounded-sm mb-2 inline-block">
                      {trip.status === 'PLANNED' ? 'Planejada' : trip.status === 'ACTIVE' ? 'Em Andamento' : 'Finalizada'}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2 -mt-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if(confirm('Tem certeza que deseja excluir esta viagem?')) {
                          deleteTrip(trip.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-2xl font-bold leading-tight group-hover:text-accent transition-colors">
                    {trip.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-6 py-2 space-y-3">
                  <div className="flex items-center text-sm font-medium">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    {trip.destination}
                  </div>
                  <div className="flex items-center text-sm font-mono text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {trip.startDate ? format(new Date(trip.startDate), 'dd/MM/yyyy') : 'Data indefinida'}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {trip.participants.length} participante{trip.participants.length !== 1 && 's'}
                  </div>
                </CardContent>
                <CardFooter className="pl-6 pt-4 border-t border-dashed border-border mt-2">
                  <div className="w-full flex items-center justify-between text-sm font-bold text-primary group-hover:text-accent transition-colors">
                    <span>VER DETALHES</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}

function Plane(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12h20" />
      <path d="M13 2l9 10-9 10" />
    </svg>
  )
}
