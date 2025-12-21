import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Plane, Plus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}

export function Layout({ children, title, action }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground">
      {/* Header estilo "Ticket" */}
      <header className="border-b-2 border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-2 border-2 border-transparent group-hover:border-primary group-hover:bg-transparent group-hover:text-primary transition-all">
              <Plane className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">
              Gestão<span className="text-accent">Viagens</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            {location !== '/' && (
              <Link href="/">
                <Button variant="outline" size="sm" className="border-2 font-bold hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Home className="h-4 w-4 mr-2" />
                  Início
                </Button>
              </Link>
            )}
            {action}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {title && (
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-dashed border-border pb-4">
            <h1 className="text-4xl font-bold tracking-tight uppercase">{title}</h1>
          </div>
        )}
        {children}
      </main>

      <footer className="border-t-2 border-border mt-auto py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground font-mono text-sm">
          <p>EST. 2025 • GESTÃO DE VIAGENS • PASSPORT EDITION</p>
        </div>
      </footer>
    </div>
  );
}
