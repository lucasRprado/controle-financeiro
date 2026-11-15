import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { useState } from 'react';
import { ALL_CATEGORIES_VALUE, DEFAULT_EXPENSE_CATEGORIES } from '../constants/finance';
import { useUserCollection } from '../hooks/useUserCollection';
import { fromCents } from '../services/userData';

const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

const formatarCentavos = (centavos) => formatarMoeda(fromCents(centavos));

const chaveDoMes = (data) =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;

const criarMeses = (dataAtual) =>
  Array.from({ length: 6 }, (_, index) => {
    const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 5 + index, 1);
    return {
      value: chaveDoMes(data),
      label: new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(data),
      shortLabel: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(data).replace('.', ''),
    };
  });

const coresCategorias = [
  '#6b9470',
  '#b29a70',
  '#718d83',
  '#c6ad88',
  '#879b69',
  '#8a8068',
  '#9cad9d',
  '#d1c5ae',
];

export function Dashboard() {
  const transacoesState = useUserCollection('transactions');
  const categoriasState = useUserCollection('expenseCategories');
  const transacoes = transacoesState.documents;
  const [meses] = useState(() => criarMeses(new Date()));
  const [mesSelecionado, setMesSelecionado] = useState(() => meses[meses.length - 1].value);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(ALL_CATEGORIES_VALUE);
  const loading = transacoesState.loading || categoriasState.loading;
  const error = transacoesState.error || categoriasState.error;
  const mesAtual = meses.find((mes) => mes.value === mesSelecionado) ?? meses[meses.length - 1];

  const categoriasRegistradas = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...categoriasState.documents
      .map((categoria) => (typeof categoria.name === 'string' ? categoria.name.trim() : '')),
    ...transacoes
      .filter((transacao) => transacao.type === 'despesa')
      .map((transacao) =>
        typeof transacao.category === 'string' && transacao.category.trim()
          ? transacao.category.trim()
          : 'Sem categoria',
      ),
  ];
  const categorias = [
    ...new Set(categoriasRegistradas.filter(Boolean)),
  ].sort((a, b) => {
    const aDefault = DEFAULT_EXPENSE_CATEGORIES.includes(a);
    const bDefault = DEFAULT_EXPENSE_CATEGORIES.includes(b);
    if (aDefault && bDefault) {
      return DEFAULT_EXPENSE_CATEGORIES.indexOf(a) - DEFAULT_EXPENSE_CATEGORIES.indexOf(b);
    }
    if (aDefault) return -1;
    if (bDefault) return 1;
    return a.localeCompare(b, 'pt-BR');
  });

  const totaisPorMes = new Map(
    meses.map((mes) => [mes.value, { receitas: 0, despesas: 0, despesasFiltradas: 0 }]),
  );
  const totaisPorCategoria = new Map();

  transacoes.forEach((transacao) => {
    const data = transacao.createdAt?.toDate?.();
    if (!data) return;

    const mesKey = chaveDoMes(data);
    const totais = totaisPorMes.get(mesKey);
    const centavos = Number.isFinite(Number(transacao.amountCents))
      ? Math.max(0, Math.round(Number(transacao.amountCents)))
      : 0;

    if (transacao.type === 'receita') {
      if (totais) totais.receitas += centavos;
      return;
    }

    if (transacao.type !== 'despesa') return;

    const categoria =
      typeof transacao.category === 'string' && transacao.category.trim()
        ? transacao.category.trim()
        : 'Sem categoria';
    if (totais) {
      totais.despesas += centavos;
      if (
        categoriaSelecionada === ALL_CATEGORIES_VALUE ||
        categoria === categoriaSelecionada
      ) {
        totais.despesasFiltradas += centavos;
      }
    }

    if (mesKey === mesSelecionado) {
      totaisPorCategoria.set(categoria, (totaisPorCategoria.get(categoria) ?? 0) + centavos);
    }
  });

  const dadosMensais = meses.map((mes) => ({
    ...mes,
    ...totaisPorMes.get(mes.value),
  }));
  const totaisSelecionados = totaisPorMes.get(mesSelecionado) ?? {
    receitas: 0,
    despesas: 0,
    despesasFiltradas: 0,
  };
  const saldoTotal = totaisSelecionados.receitas - totaisSelecionados.despesas;
  const maiorBarra = Math.max(
    1,
    ...dadosMensais.map((mes) => Math.max(mes.receitas, mes.despesasFiltradas)),
  );
  const temDadosMensais = dadosMensais.some((mes) => mes.receitas > 0 || mes.despesasFiltradas > 0);
  const distribuicaoCategorias = [...totaisPorCategoria.entries()]
    .map(([nome, valor], index) => ({
      nome,
      valor,
      cor: coresCategorias[index % coresCategorias.length],
    }))
    .sort((a, b) => b.valor - a.valor);
  const totalDespesasDoMes = distribuicaoCategorias.reduce((total, categoria) => total + categoria.valor, 0);
  const fatiasDonut = distribuicaoCategorias.reduce(
    (resultado, categoria) => {
      const inicio = resultado.percentualAcumulado;
      const fim = inicio + (categoria.valor / (totalDespesasDoMes || 1)) * 100;
      return {
        percentualAcumulado: fim,
        fatias: [...resultado.fatias, `${categoria.cor} ${inicio}% ${fim}%`],
      };
    },
    { percentualAcumulado: 0, fatias: [] },
  ).fatias;
  const estiloDonut = {
    background:
      totalDespesasDoMes > 0
        ? `conic-gradient(${fatiasDonut.join(', ')})`
        : '#e8e8de',
  };

  const resumo = [
    {
      titulo: 'Receitas do período',
      valor: formatarCentavos(totaisSelecionados.receitas),
      observacao: mesAtual.label,
      Icon: ArrowUpRight,
      estilo: 'income',
    },
    {
      titulo: 'Despesas no filtro',
      valor: formatarCentavos(totaisSelecionados.despesasFiltradas),
      observacao:
        categoriaSelecionada === ALL_CATEGORIES_VALUE
          ? `Todas as categorias · ${mesAtual.label}`
          : `${categoriaSelecionada} · ${mesAtual.label}`,
      Icon: ArrowDownRight,
      estilo: 'expense',
    },
    {
      titulo: 'Saldo total do período',
      valor: formatarCentavos(saldoTotal),
      observacao: 'Receitas menos todas as despesas',
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

      <section className="surface-card dashboard-filters" aria-labelledby="dashboard-filters-title">
        <div>
          <h2 className="section-title" id="dashboard-filters-title">Análise do período</h2>
          <p className="section-description">
            Compare os últimos seis meses e filtre as despesas por categoria.
          </p>
        </div>
        <div className="dashboard-filter-controls">
          <div className="form-field">
            <label className="form-label" htmlFor="filtro-mes">Mês de referência</label>
            <select
              className="form-select"
              id="filtro-mes"
              value={mesSelecionado}
              onChange={(event) => setMesSelecionado(event.target.value)}
            >
              {meses.map((mes) => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="filtro-categoria">Categoria das despesas</label>
            <select
              className="form-select"
              id="filtro-categoria"
              value={categoriaSelecionada}
              onChange={(event) => setCategoriaSelecionada(event.target.value)}
            >
              <option value={ALL_CATEGORIES_VALUE}>Todas as categorias</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="dashboard-filter-note">
          O filtro afeta os totais e o comparativo mensal. A distribuição inclui todas as categorias; o saldo considera todas as despesas.
        </p>
      </section>

      <section className="dashboard-grid" aria-label={`Resumo financeiro de ${mesAtual.label}`}>
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

      <section className="insights-grid" aria-label="Gráficos financeiros">
        <article className="surface-card insight-card" aria-labelledby="cashflow-title">
          <div className="insight-heading">
            <h2 className="section-title" id="cashflow-title">Receitas e despesas</h2>
            <p className="section-description">
              Comparativo mensal nos últimos seis meses. Despesas respeitam o filtro selecionado.
            </p>
          </div>
          <div className="chart-legend" aria-hidden="true">
            <span><i className="legend-swatch income" />Receitas</span>
            <span>
              <i className="legend-swatch expense" />
              {categoriaSelecionada === ALL_CATEGORIES_VALUE
                ? 'Despesas'
                : `Despesas · ${categoriaSelecionada}`}
            </span>
          </div>
          {loading || error ? (
            <p className="empty-state chart-empty-state" role={loading ? 'status' : undefined}>
              {loading ? 'Carregando dados do gráfico...' : 'Não foi possível carregar este gráfico.'}
            </p>
          ) : temDadosMensais ? (
            <div className="cashflow-chart" role="list" aria-label="Comparativo de receitas e despesas por mês">
              {dadosMensais.map((mes) => {
                const alturaReceita = mes.receitas
                  ? Math.max(4, (mes.receitas / maiorBarra) * 145)
                  : 0;
                const alturaDespesa = mes.despesasFiltradas
                  ? Math.max(4, (mes.despesasFiltradas / maiorBarra) * 145)
                  : 0;
                return (
                  <div
                    className="cashflow-month"
                    role="listitem"
                    aria-label={`${mes.label}: receitas ${formatarCentavos(mes.receitas)}, despesas ${formatarCentavos(mes.despesasFiltradas)}`}
                    key={mes.value}
                  >
                    <div className="cashflow-bars" aria-hidden="true">
                      <span className="cashflow-bar income" style={{ height: `${alturaReceita}px` }} />
                      <span className="cashflow-bar expense" style={{ height: `${alturaDespesa}px` }} />
                    </div>
                    <span className="cashflow-month-label">{mes.shortLabel}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-state chart-empty-state">
              Ainda não há lançamentos nos últimos seis meses para este filtro.
            </p>
          )}
        </article>

        <article className="surface-card insight-card" aria-labelledby="categories-title">
          <div className="insight-heading">
            <h2 className="section-title" id="categories-title">Despesas por categoria</h2>
            <p className="section-description">Distribuição de {mesAtual.label}.</p>
          </div>
          {loading || error ? (
            <p className="empty-state chart-empty-state" role={loading ? 'status' : undefined}>
              {loading ? 'Carregando dados do gráfico...' : 'Não foi possível carregar este gráfico.'}
            </p>
          ) : totalDespesasDoMes > 0 ? (
            <div className="category-chart-content">
              <div
                className="category-donut"
                style={estiloDonut}
                role="img"
                aria-label={`Total de despesas no período: ${formatarCentavos(totalDespesasDoMes)}`}
              >
                <div className="category-donut-center">
                  <span>Total</span>
                  <strong>{formatarCentavos(totalDespesasDoMes)}</strong>
                </div>
              </div>
              <ul className="category-legend">
                {distribuicaoCategorias.map((categoria) => (
                  <li className="category-legend-item" key={categoria.nome}>
                    <span
                      className="legend-swatch"
                      style={{ backgroundColor: categoria.cor }}
                      aria-hidden="true"
                    />
                    <span className="category-legend-name">{categoria.nome}</span>
                    <strong>{formatarCentavos(categoria.valor)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="empty-state chart-empty-state">
              Nenhuma despesa registrada em {mesAtual.label}.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
