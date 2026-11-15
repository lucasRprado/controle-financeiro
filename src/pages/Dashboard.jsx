import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';

const resumo = [
  {
    titulo: 'Receitas do mês',
    valor: 'R$ 0,00',
    observacao: 'Entradas registradas',
    Icon: ArrowUpRight,
    estilo: 'income',
  },
  {
    titulo: 'Despesas do mês',
    valor: 'R$ 0,00',
    observacao: 'Saídas registradas',
    Icon: ArrowDownRight,
    estilo: 'expense',
  },
  {
    titulo: 'Saldo atual',
    valor: 'R$ 0,00',
    observacao: 'Receitas menos despesas',
    Icon: Wallet,
    estilo: 'balance',
  },
];

export function Dashboard() {
  return (
    <div>
      <header className="page-header">
        <p className="page-kicker">Seu resumo financeiro</p>
        <h1 className="page-title">Visão geral</h1>
        <p className="page-description">
          Acompanhe suas finanças com clareza e mantenha seus objetivos por perto.
        </p>
      </header>

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
              <strong className="summary-value">{valor}</strong>
              <span className="summary-note">{observacao}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Dashboard;
