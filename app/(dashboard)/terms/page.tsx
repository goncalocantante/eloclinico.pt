
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
        </Link>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-8">Termos de Serviço</h1>
        <p className="lead text-xl text-gray-600 dark:text-gray-400 mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-PT')}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
          <p className="mb-4">
            Ao aceder e utilizar o <strong>Elo</strong>, você aceita e concorda em cumprir os termos e disposições deste acordo. Além disso, ao utilizar os serviços, você estará sujeito a quaisquer regras ou diretrizes publicadas aplicáveis a tais serviços.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
          <p className="mb-4">
            O Elo fornece uma plataforma de gestão para psicólogos e terapeutas, incluindo funcionalidades de agendamento, gestão de pacientes e notas de sessão. Reservamo-nos o direito de modificar ou descontinuar o serviço a qualquer momento.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Registo e Segurança da Conta</h2>
          <p className="mb-4">
            Para utilizar certas funcionalidades do Serviço, poderá ser necessário registar-se. Você concorda em fornecer informações verdadeiras e completas e em manter a segurança da sua senha e identificação de conta.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Conduta do Utilizador</h2>
          <p className="mb-4">
            Você concorda em não utilizar o Serviço para:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Violar qualquer lei local, estadual, nacional ou internacional aplicável.</li>
            <li>Transmitir qualquer material que seja ilegal, ofensivo ou que viole direitos de terceiros.</li>
            <li>Interferir ou interromper o Serviço ou servidores conectados ao Serviço.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Propriedade Intelectual</h2>
          <p className="mb-4">
            Todo o conteúdo incluído no Serviço, como texto, gráficos, logotipos e software, é propriedade do Elo ou dos seus fornecedores de conteúdo e está protegido pelas leis de direitos autorais internacionais.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Limitação de Responsabilidade</h2>
          <p className="mb-4">
            O Elo não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais ou consequentes resultantes do uso ou da incapacidade de usar o serviço.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contacto</h2>
          <p>
            Se tiver alguma dúvida sobre estes Termos de Serviço, por favor contacte-nos através do e-mail: <a href="mailto:suporte@eloclinico.pt" className="text-primary hover:underline">suporte@eloclinico.pt</a>
          </p>
        </section>
      </div>
    </main>
  );
}
