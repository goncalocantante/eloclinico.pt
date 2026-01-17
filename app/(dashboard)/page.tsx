import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Users, Shield, Clock, BrainCircuit, Activity } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              O Sistema Operativo para a Terapia Moderna
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 mb-6 font-manrope">
              Conecte-se mais com o <span className="text-primary">Elo</span>.
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Otimize o seu consultório com agendamento inteligente, notas de pacientes seguras e fluxos de trabalho automatizados. Foque-se nos seus pacientes, não na papelada.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="rounded-full text-lg px-8 h-12 shadow-lg shadow-primary/25">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="rounded-full text-lg px-8 h-12">
                  Saber mais
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 dark:opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl mb-4">
              Tudo o que precisa para prosperar
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Construído especificamente para psicólogos e terapeutas, o Elo cria uma ponte perfeita entre si e os seus pacientes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="h-8 w-8 text-primary" />}
              title="Agendamento Inteligente"
              description="Gestão de marcações sem esforço com lembretes automáticos e sincronização de calendário. Reduza as faltas eficazmente."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-secondary" />}
              title="Gestão de Pacientes"
              description="Mantenha todos os registos, histórico e detalhes de contacto dos pacientes organizados num painel seguro e compatível."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-primary" />}
              title="Seguro e Privado"
              description="Os seus dados e a privacidade dos seus pacientes são a nossa prioridade. Protocolos de segurança de nível empresarial."
            />
            <FeatureCard
              icon={<Clock className="h-8 w-8 text-secondary" />}
              title="Poupança de Tempo"
              description="Automatize tarefas repetitivas como formulários de admissão e faturação, poupando horas todas as semanas."
            />
            <FeatureCard
              icon={<BrainCircuit className="h-8 w-8 text-primary" />}
              title="Ferramentas Clínicas"
              description="Aceda a ferramentas integradas para avaliações e acompanhamento do progresso, desenhadas para a terapia moderna."
            />
            <FeatureCard
              icon={<Activity className="h-8 w-8 text-secondary" />}
              title="Análise do Consultório"
              description="Obtenha insights sobre o crescimento do seu consultório, taxas de retenção e saúde financeira com análises simples."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-gray-950 contrast-more:border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl mb-6">
            Pronto para evoluir o seu consultório?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
            Junte-se a milhares de terapeutas que estão a otimizar o seu fluxo de trabalho e a focar-se no que mais importa — os seus pacientes.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="rounded-full text-lg px-10 h-14 shadow-xl shadow-primary/20">
              Comece o seu teste gratuito
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Elo</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            <span>© {new Date().getFullYear()} Elo. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl w-fit">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
