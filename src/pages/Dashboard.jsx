import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useUserCollection } from '../hooks/useUserCollection';
import { fromCents } from '../services/userData';

const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function Dashboard() {
  const { documents: transacoes, loading, error } = useUserCollection('transactions');
  const [hoje] = useState(() => new Date());
  const totais = transacoes.reduce((resultado, transacao) => {
    const data = transacao.createdAt?.toDate?.();
    if (!data || data.getMonth() !== hoje.getMonth() || data.getFullYear() !== hoje.getFullYear()) {
      return resultado;
    }

    if (transacao.type === 'receita') {
      resultado.receitas += fromCents(transacao.amountCents);
    } else if (transacao.type === 'despesa') {
      resultado.despesas += fromCents(transacao.amountCents);
    }
    return resultado;
  }, { receitas: 0, despesas: 0 });

  const resumo = [
    {
      titulo: 'Receitas do mês',
      valor: formatarMoeda(totais.receitas),
      observacao: 'Entradas registradas',
      Icon: ArrowUpRight,
      estilo: 'income',
    },
    {
      titulo: 'Despesas do mês',
      valor: formatarMoeda(totais.despesas),
      observacao: 'Saídas registradas',
      Icon: ArrowDownRight,
      estilo: 'expense',
    },
    {
      titulo: 'Saldo atual',
      valor: formatarMoeda(totais.receitas - totais.despesas),
      observacao: 'Receitas menos despesas',
      Icon: Wallet,
      estilo: 'balance',
    },
  ];

  return (
    <div>
      <header className="page-header">
        <p className="page-kicker">Seu resumo financeiro</p>
        <h1 className="page-title">Visão geral</h1>
        <p className="page-description">
          Acompanhe suas finanças com clareza e mantenha seus objetivos por perto.
        </p>
      </header>

      {error && <p className="feedback-error" role="alert">{error}</p>}
      {loading && <p className="feedback-note" role="status">Carregando seu resumo...</p>}

      <section className="dashboard-grid" aria-label="Resumo financeiro do mês">
        {resumo.map(({ titulo, valor, observacao, Icon, estilo }) => (
          <article className="summary-card" key={titulo}>
            <div className="summary-card-top">
              <p className="summary-label">{titulo}</p>
              <span className={`summary-icon ${estilo}`}>
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </div>
            <div>
              <strong className="summary-value">{loading ? '—' : valor}</strong>
              <span className="summary-note">{observacao}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Dashboard;
