import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Centinela Vial</h1>
        </div>
      </header>
      <main className="flex-grow flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-primary font-semibold">Inteligencia Vial de Nueva Generación</p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Construyendo Vías Más Seguras en Florida, Valle
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Centinela Vial utiliza IA de vanguardia para analizar datos de accidentalidad, identificar zonas críticas y sugerir intervenciones viales efectivas. Empoderando a las autoridades de tránsito para tomar decisiones basadas en datos para un mañana más seguro.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Ir al Panel
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                Conocer Más
              </Button>
            </div>
          </div>
        </div>
      </main>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Centinela Vial. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
