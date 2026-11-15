import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../constants/finance';
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
  const [opcoesMes] = useState(() => criarMeses(new Date()));
  const [mesSelecionado, setMesSelecionado] = useState(
    () => opcoesMes[opcoesMes.length - 1].value,
  );
  const [tipoGrafico, setTipoGrafico] = useState('despesas');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState(null);
  const loading = transacoesState.loading || categoriasState.loading;
  const error = transacoesState.error || categoriasState.error;
  const mesAtual =
    opcoesMes.find((mes) => mes.value === mesSelecionado) ?? opcoesMes[opcoesMes.length - 1];
  const [anoMesSelecionado, numeroMesSelecionado] = mesAtual.value.split('-').map(Number);
  const meses = criarMeses(new Date(anoMesSelecionado, numeroMesSelecionado - 1, 1));
  const filtroCategoriaAtivo = tipoGrafico === 'despesas';

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
  const todasCategoriasSelecionadas = categoriasSelecionadas === null;
  const rotuloTipoGrafico = tipoGrafico === 'receitas' ? 'Receitas' : 'Despesas';
  const rotuloModoGrafico = tipoGrafico === 'comparativo' ? 'Comparativo' : rotuloTipoGrafico;
  const tituloGrafico =
    tipoGrafico === 'comparativo' ? 'Receitas versus despesas' : `${rotuloTipoGrafico} por mês`;
  const rotuloFiltroCategoria =
    !filtroCategoriaAtivo || todasCategoriasSelecionadas
      ? 'Todas as categorias'
      : categoriasSelecionadas.length === 0
        ? 'Nenhuma categoria selecionada'
        : `${categoriasSelecionadas.length} ${
          categoriasSelecionadas.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'
        }`;

  const alternarCategoria = (categoria, selecionada) => {
    if (todasCategoriasSelecionadas) {
      if (selecionada) return;
      setCategoriasSelecionadas(categorias.filter((item) => item !== categoria));
      return;
    }

    const proximaSelecao = selecionada
      ? [...categoriasSelecionadas, categoria]
      : categoriasSelecionadas.filter((item) => item !== categoria);
    setCategoriasSelecionadas(
      categorias.length > 0 && categorias.every((item) => proximaSelecao.includes(item))
        ? null
        : proximaSelecao,
    );
  };

  const selecionarTodasCategorias = (selecionada) => {
    setCategoriasSelecionadas(selecionada ? null : []);
  };

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
    const categoriaIncluida =
      !filtroCategoriaAtivo ||
      todasCategoriasSelecionadas ||
      categoriasSelecionadas.includes(categoria);
    if (totais) {
      totais.despesas += centavos;
      if (categoriaIncluida) {
        totais.despesasFiltradas += centavos;
      }
    }

    if (mesKey === mesSelecionado && categoriaIncluida) {
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
  const seriesGrafico = tipoGrafico === 'comparativo'
    ? [
      { chave: 'receitas', label: 'Receitas', estilo: 'income' },
      { chave: 'despesasFiltradas', label: 'Despesas', estilo: 'expense' },
    ]
    : [{
      chave: tipoGrafico === 'receitas' ? 'receitas' : 'despesasFiltradas',
      label: rotuloTipoGrafico,
      estilo: tipoGrafico === 'receitas' ? 'income' : 'expense',
    }];
  const obterValorDoGrafico = (mes, serie) => mes[serie.chave];
  const maiorBarra = Math.max(
    1,
    ...dadosMensais.flatMap((mes) =>
      seriesGrafico.map((serie) => obterValorDoGrafico(mes, serie)),
    ),
  );
  const temDadosMensais = dadosMensais.some((mes) =>
    seriesGrafico.some((serie) => obterValorDoGrafico(mes, serie) > 0),
  );
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
      titulo: filtroCategoriaAtivo ? 'Despesas no filtro' : 'Despesas do mês',
      valor: formatarCentavos(totaisSelecionados.despesasFiltradas),
      observacao: filtroCategoriaAtivo
        ? `${rotuloFiltroCategoria} · ${mesAtual.label}`
        : `Todas as categorias · ${mesAtual.label}`,
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
          <h2 className="section-title" id="dashboard-filters-title">Filtros do dashboard</h2>
          <p className="section-description">
            {filtroCategoriaAtivo
              ? 'Escolha o mês, o tipo de gráfico e as categorias de despesas.'
              : 'Escolha o mês e o tipo de gráfico. O filtro por categoria aparece no modo Despesas.'}
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
              {opcoesMes.map((mes) => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
          </div>
          <fieldset className="chart-type-filter">
            <legend className="form-label">Tipo de gráfico</legend>
            <div className="chart-type-options">
              {[
                { value: 'receitas', label: 'Receitas' },
                { value: 'despesas', label: 'Despesas' },
                { value: 'comparativo', label: 'Comparativo' },
              ].map((tipo) => (
                <label
                  className={`chart-type-option${tipoGrafico === tipo.value ? ' is-selected' : ''}`}
                  key={tipo.value}
                >
                  <input
                    type="radio"
                    name="tipo-grafico"
                    value={tipo.value}
                    checked={tipoGrafico === tipo.value}
                    onChange={() => setTipoGrafico(tipo.value)}
                  />
                  <span>{tipo.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {filtroCategoriaAtivo && (
          <fieldset className="expense-category-filter">
            <legend className="form-label">Categorias de despesas</legend>
            <p className="category-filter-help">
              Todas começam marcadas. Desmarque “Todas as categorias” para escolher itens específicos ou desmarque categorias que deseja excluir.
            </p>
            <div className="category-checkbox-grid">
              <label className="category-checkbox">
                <input
                  type="checkbox"
                  checked={todasCategoriasSelecionadas}
                  onChange={(event) => selecionarTodasCategorias(event.target.checked)}
                />
                <span>Todas as categorias</span>
              </label>
              {categorias.map((categoria) => (
                <label className="category-checkbox" key={categoria}>
                  <input
                    type="checkbox"
                    checked={
                      todasCategoriasSelecionadas ||
                      categoriasSelecionadas.includes(categoria)
                    }
                    onChange={(event) => alternarCategoria(categoria, event.target.checked)}
                  />
                  <span>{categoria}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <p className="dashboard-filter-note">
          O filtro por categoria só se aplica no modo Despesas. O saldo sempre considera todas as movimentações do mês.
        </p>
        <p className="dashboard-print-context print-only">
          Mês: {mesAtual.label} · Gráfico: {rotuloModoGrafico} · Categorias: {rotuloFiltroCategoria}
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
            <h2 className="section-title" id="cashflow-title">{tituloGrafico}</h2>
            <p className="section-description">
              {tipoGrafico === 'comparativo'
                ? `Compare receitas e despesas nos seis meses até ${mesAtual.label}.`
                : `${rotuloTipoGrafico} mensais nos seis meses até ${mesAtual.label}.`}
            </p>
          </div>
          <div className="chart-legend" aria-hidden="true">
            {seriesGrafico.map((serie) => (
              <span key={serie.chave}>
                <i className={`legend-swatch ${serie.estilo}`} />
                {serie.label}
                {serie.label === 'Despesas' && filtroCategoriaAtivo
                  ? ` · ${rotuloFiltroCategoria}`
                  : ''}
              </span>
            ))}
          </div>
          {loading || error ? (
            <p className="empty-state chart-empty-state" role={loading ? 'status' : undefined}>
              {loading ? 'Carregando dados do gráfico...' : 'Não foi possível carregar este gráfico.'}
            </p>
          ) : temDadosMensais ? (
            <>
              <div
                className={`cashflow-chart${tipoGrafico === 'comparativo' ? ' is-comparative' : ''}`}
                role="list"
                aria-label={
                  tipoGrafico === 'comparativo'
                    ? 'Comparativo mensal de receitas e despesas'
                    : `${rotuloTipoGrafico} por mês`
                }
              >
                {dadosMensais.map((mes) => {
                  const valores = seriesGrafico.map((serie) => ({
                    ...serie,
                    valor: obterValorDoGrafico(mes, serie),
                  }));
                  return (
                    <div
                      className="cashflow-month"
                      role="listitem"
                      aria-label={`${mes.label}: ${valores
                        .map(({ label, valor }) => `${label.toLowerCase()} ${formatarCentavos(valor)}`)
                        .join(', ')}`}
                      key={mes.value}
                    >
                      <div className="cashflow-bars" aria-hidden="true">
                        {valores.map((serie) => {
                          const altura = serie.valor
                            ? Math.max(4, (serie.valor / maiorBarra) * 145)
                            : 0;
                          return (
                            <span
                              className={`cashflow-bar ${serie.estilo}`}
                              style={{ height: `${altura}px` }}
                              key={serie.chave}
                            />
                          );
                        })}
                      </div>
                      <span className="cashflow-month-label">{mes.shortLabel}</span>
                    </div>
                  );
                })}
              </div>
              <table className="monthly-data-table print-only">
                <caption>{tituloGrafico} dos últimos seis meses</caption>
                <thead>
                  <tr>
                    <th scope="col">Mês</th>
                    {seriesGrafico.map((serie) => (
                      <th scope="col" key={serie.chave}>{serie.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dadosMensais.map((mes) => (
                    <tr key={mes.value}>
                      <th scope="row">{mes.label}</th>
                      {seriesGrafico.map((serie) => (
                        <td key={serie.chave}>
                          {formatarCentavos(obterValorDoGrafico(mes, serie))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="empty-state chart-empty-state">
              {tipoGrafico === 'despesas' && categoriasSelecionadas?.length === 0
                ? 'Selecione ao menos uma categoria para visualizar as despesas.'
                : tipoGrafico === 'comparativo'
                  ? 'Ainda não há receitas ou despesas nos últimos seis meses.'
                  : `Ainda não há lançamentos nos últimos seis meses para ${rotuloTipoGrafico.toLowerCase()}.`}
            </p>
          )}
        </article>

        <article className="surface-card insight-card" aria-labelledby="categories-title">
          <div className="insight-heading">
            <h2 className="section-title" id="categories-title">Despesas por categoria</h2>
            <p className="section-description">
              {mesAtual.label} · {rotuloFiltroCategoria}.
            </p>
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
              Nenhuma despesa corresponde às categorias selecionadas em {mesAtual.label}.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
