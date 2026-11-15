import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import React, { useState } from 'react';

const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function Custos() {
  const [transacoes, setTransacoes] = useState([]);
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [valorDespesa, setValorDespesa] = useState('');
  const [categoriaDespesa, setCategoriaDespesa] = useState('Alimentação');
  const [descricaoReceita, setDescricaoReceita] = useState('');
  const [valorReceita, setValorReceita] = useState('');

  const adicionarTransacao = (event, transacao, limparFormulario) => {
    event.preventDefault();

    const descricao = transacao.descricao.trim();
    const valor = Number(transacao.valor);
    if (!descricao || !Number.isFinite(valor) || valor <= 0) {
      alert('Informe uma descrição e um valor maior que zero.');
      return;
    }

    setTransacoes((atuais) => [
      {
        id: Date.now().toString(),
        descricao,
        valor,
        tipo: transacao.tipo,
        categoria: transacao.categoria,
        data: new Date().toLocaleDateString('pt-BR'),
      },
      ...atuais,
    ]);
    limparFormulario();
  };

  return (
    <div>
      <header className="page-header">
        <p className="page-kicker">Movimentações</p>
        <h1 className="page-title">Receitas e despesas</h1>
        <p className="page-description">
          Registre entradas e gastos em espaços separados para manter seu orçamento organizado.
        </p>
      </header>

      <div className="transaction-grid">
        <form
          className="form-card"
          onSubmit={(event) =>
            adicionarTransacao(
              event,
              {
                descricao: descricaoReceita,
                valor: valorReceita,
                tipo: 'receita',
              },
              () => {
                setDescricaoReceita('');
                setValorReceita('');
              },
            )
          }
        >
          <div className="form-heading">
            <span className="section-icon income">
              <ArrowUpRight size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="section-title">Registrar receita</h2>
              <p className="section-description">Entradas de dinheiro</p>
            </div>
          </div>

          <div className="form-fields">
            <div className="form-field">
              <label className="form-label" htmlFor="descricao-receita">Descrição</label>
              <input
                className="form-input"
                id="descricao-receita"
                type="text"
                value={descricaoReceita}
                onChange={(event) => setDescricaoReceita(event.target.value)}
                placeholder="Ex.: salário"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="valor-receita">Valor (R$)</label>
              <input
                className="form-input"
                id="valor-receita"
                type="number"
                min="0.01"
                step="0.01"
                value={valorReceita}
                onChange={(event) => setValorReceita(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <button className="button button-primary form-submit" type="submit">
            Adicionar receita
          </button>
        </form>

        <form
          className="form-card expense-card"
          onSubmit={(event) =>
            adicionarTransacao(
              event,
              {
                descricao: descricaoDespesa,
                valor: valorDespesa,
                tipo: 'despesa',
                categoria: categoriaDespesa,
              },
              () => {
                setDescricaoDespesa('');
                setValorDespesa('');
              },
            )
          }
        >
          <div className="form-heading">
            <span className="section-icon expense">
              <ArrowDownRight size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="section-title">Registrar despesa</h2>
              <p className="section-description">Custos e outras saídas</p>
            </div>
          </div>

          <div className="form-fields">
            <div className="form-field">
              <label className="form-label" htmlFor="descricao-despesa">Descrição</label>
              <input
                className="form-input"
                id="descricao-despesa"
                type="text"
                value={descricaoDespesa}
                onChange={(event) => setDescricaoDespesa(event.target.value)}
                placeholder="Ex.: supermercado"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="valor-despesa">Valor (R$)</label>
              <input
                className="form-input"
                id="valor-despesa"
                type="number"
                min="0.01"
                step="0.01"
                value={valorDespesa}
                onChange={(event) => setValorDespesa(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="categoria-despesa">Categoria da despesa</label>
              <select
                className="form-select"
                id="categoria-despesa"
                value={categoriaDespesa}
                onChange={(event) => setCategoriaDespesa(event.target.value)}
              >
                <option value="Alimentação">Alimentação</option>
                <option value="Moradia">Moradia</option>
                <option value="Transporte">Transporte</option>
                <option value="Saúde">Saúde</option>
                <option value="Lazer">Lazer</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <button className="button button-expense form-submit" type="submit">
            Adicionar despesa
          </button>
        </form>
      </div>

      <section className="history-card" aria-labelledby="historico-title">
        <h2 className="section-title" id="historico-title">Histórico de lançamentos</h2>
        {transacoes.length === 0 ? (
          <p className="empty-state">Nenhuma receita ou despesa cadastrada ainda.</p>
        ) : (
          <ul className="history-list">
            {transacoes.map((item) => (
              <li className="history-item" key={item.id}>
                <div className="history-primary">
                  <strong className="history-description">{item.descricao}</strong>
                  <div className="history-meta">
                    {item.tipo === 'receita' ? 'Receita' : `Despesa · ${item.categoria}`}
                  </div>
                  <time className="history-date">{item.data}</time>
                </div>
                <strong className={`history-amount ${item.tipo}`}>
                  {item.tipo === 'receita' ? '+' : '−'} {formatarMoeda(item.valor)}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Custos;
