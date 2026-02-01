
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
        <p className="lead text-xl text-gray-600 dark:text-gray-400 mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-PT')}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
          <p className="mb-4">
            O <strong>Elo</strong>valoriza a sua privacidade. Esta Política de Privacidade explica como recolhemos, utilizamos, divulgamos e protegemos as suas informações quando utiliza a nossa aplicação web e serviços associados (coletivamente, o &quot;Serviço&quot;).
          </p>
          <p>
            Ao aceder ou utilizar o Serviço, concorda com a recolha e utilização das suas informações de acordo com esta política.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Informações que Recolhemos</h2>
          <p className="mb-4">
            Podemos recolher os seguintes tipos de informações:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Informações Pessoais:</strong> Nome, endereço de e-mail e outras informações que nos fornece ao registar-se ou comunicar connosco.
            </li>
            <li>
              <strong>Dados da Conta Google:</strong> Quando se regista ou faz login usando a sua conta Google, podemos aceder ao seu perfil básico (nome, e-mail, foto) e, com a sua permissão explícita, aos seus dados de calendário para sincronizar compromissos.
            </li>
            <li>
              <strong>Dados de Utilização:</strong> Informações sobre como acede e utiliza o Serviço, incluindo o seu endereço IP, tipo de navegador, páginas visitadas e carimbos de data/hora.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Como Utilizamos as Suas Informações</h2>
          <p className="mb-4">
            Utilizamos as informações recolhidas para:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Fornecer, manter e melhorar o nosso Serviço.</li>
            <li>Processar transações e gerir a sua conta.</li>
            <li>Sincronizar os seus compromissos com o Google Calendar (apenas com a sua permissão).</li>
            <li>Comunicar consigo sobre atualizações, segurança e suporte.</li>
            <li>Cumprir obrigações legais.</li>
          </ul>
          <p className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <strong>Nota Importante sobre Dados do Google:</strong> O uso e a transferência de informações recebidas das APIs do Google para qualquer outra aplicação respeitarão a <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Política de Dados do Utilizador dos Serviços da API do Google</a>, incluindo os requisitos de Utilização Limitada.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Partilha de Informações</h2>
          <p className="mb-4">
            Não vendemos nem alugamos as suas informações pessoais a terceiros. Podemos partilhar informações apenas nas seguintes circunstâncias:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Com prestadores de serviços que nos ajudam a operar o Serviço (ex: alojamento, processamento de pagamentos).</li>
            <li>Para cumprir leis ou responder a processos legais.</li>
            <li>Para proteger os direitos e segurança do Elo, dos nossos utilizadores ou do público.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Segurança dos Dados</h2>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger as suas informações contra acesso, alteração, divulgação ou destruição não autorizados. No entanto, nenhum método de transmissão pela Internet ou armazenamento eletrónico é 100% seguro.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Os Seus Direitos</h2>
          <p className="mb-4">
            Você tem o direito de:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Aceder, corrigir ou eliminar as suas informações pessoais.</li>
            <li>Revogar o consentimento para o processamento de dados (como o acesso ao Google Calendar) a qualquer momento.</li>
            <li>Solicitar a portabilidade dos seus dados.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contacte-nos</h2>
          <p>
            Se tiver alguma dúvida sobre esta Política de Privacidade, por favor contacte-nos através do e-mail: <a href="mailto:suporte@eloclinico.pt" className="text-primary hover:underline">suporte@eloclinico.pt</a>
          </p>
        </section>
      </div>
    </main>
  );
}
