import { ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../constants/finance';
import { useAuth } from '../hooks/useAuth';
import { useUserCollection } from '../hooks/useUserCollection';
import {
  createUserRecord,
  deleteUserRecord,
  firebaseErrorMessage,
  fromCents,
  toCents,
} from '../services/userData';

const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

const formatarData = (timestamp) => {
  const data = timestamp?.toDate?.();
  return data ? data.toLocaleDateString('pt-BR') : 'Salvando...';
};

export function Custos() {
  const { user } = useAuth();
  const transacoesState = useUserCollection('transactions');
  const categoriasState = useUserCollection('expenseCategories');
  const modelosReceitaState = useUserCollection('incomePresets');
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [valorDespesa, setValorDespesa] = useState('');
  const [categoriaDespesa, setCategoriaDespesa] = useState('Alimentação');
  const [descricaoReceita, setDescricaoReceita] = useState('');
  const [valorReceita, setValorReceita] = useState('');
  const [modeloReceitaSelecionado, setModeloReceitaSelecionado] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoModeloReceita, setNovoModeloReceita] = useState('');
  const [writeError, setWriteError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const transacoes = transacoesState.documents;
  const categoriasPersonalizadas = categoriasState.documents
    .filter(
      (categoria) =>
        typeof categoria.name === 'string' &&
        categoria.name.trim() &&
        !DEFAULT_EXPENSE_CATEGORIES.includes(categoria.name),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const categoriasDespesa = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...categoriasPersonalizadas.map((categoria) => categoria.name),
  ];
  const modelosReceita = modelosReceitaState.documents
    .filter((modelo) => typeof modelo.name === 'string' && modelo.name.trim())
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const categoriasEmUso = new Set(
    transacoes
      .filter((item) => item.type === 'despesa' && item.category)
      .map((item) => item.category),
  );
  const loading = transacoesState.loading || categoriasState.loading || modelosReceitaState.loading;
  const loadError = transacoesState.error || categoriasState.error || modelosReceitaState.error;

  const adicionarTransacao = async (event, transacao, limparFormulario) => {
    event.preventDefault();

    const descricao = transacao.descricao.trim();
    const valor = Number(transacao.valor);
    if (!descricao || !Number.isFinite(valor) || valor <= 0) {
      alert('Informe uma descrição e um valor maior que zero.');
      return;
    }

    setWriteError('');
    setIsSaving(true);
    try {
      await createUserRecord(user.uid, 'transactions', {
        description: descricao,
        amountCents: toCents(valor),
        type: transacao.tipo,
        ...(transacao.categoria ? { category: transacao.categoria } : {}),
      });
      limparFormulario();
    } catch (error) {
      console.error('Não foi possível salvar o lançamento:', error);
      setWriteError(firebaseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const cadastrarCategoria = async (event) => {
    event.preventDefault();
    const nome = novaCategoria.trim();
    const jaExiste = categoriasDespesa.some(
      (categoria) => categoria.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'),
    );
    if (!nome || jaExiste) {
      setWriteError(jaExiste ? 'Essa categoria já está cadastrada.' : 'Informe um nome para a categoria.');
      return;
    }

    setWriteError('');
    setIsSaving(true);
    try {
      await createUserRecord(user.uid, 'expenseCategories', { name: nome });
      setNovaCategoria('');
      setCategoriaDespesa(nome);
    } catch (error) {
      console.error('Não foi possível cadastrar a categoria:', error);
      setWriteError(firebaseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const excluirCategoria = async (categoria) => {
    if (categoriasEmUso.has(categoria.name)) return;
    if (!window.confirm(`Deseja excluir a categoria "${categoria.name}"?`)) return;

    setWriteError('');
    setIsSaving(true);
    try {
      await deleteUserRecord(user.uid, 'expenseCategories', categoria.id);
      if (categoriaDespesa === categoria.name) setCategoriaDespesa('Alimentação');
    } catch (error) {
      console.error('Não foi possível excluir a categoria:', error);
      setWriteError(firebaseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const cadastrarModeloReceita = async (event) => {
    event.preventDefault();
    const nome = novoModeloReceita.trim();
    const jaExiste = modelosReceita.some(
      (modelo) => modelo.name.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'),
    );
    if (!nome || jaExiste) {
      setWriteError(jaExiste ? 'Esse modelo de receita já está cadastrado.' : 'Informe um nome para o modelo.');
      return;
    }

    setWriteError('');
    setIsSaving(true);
    try {
      await createUserRecord(user.uid, 'incomePresets', { name: nome });
      setNovoModeloReceita('');
    } catch (error) {
      console.error('Não foi possível cadastrar o modelo de receita:', error);
      setWriteError(firebaseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const excluirModeloReceita = async (modelo) => {
    setWriteError('');
    setIsSaving(true);
    try {
      await deleteUserRecord(user.uid, 'incomePresets', modelo.id);
      if (modeloReceitaSelecionado === modelo.id) setModeloReceitaSelecionado('');
    } catch (error) {
      console.error('Não foi possível excluir o modelo de receita:', error);
      setWriteError(firebaseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
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

      {(writeError || loadError) && (
        <p className="feedback-error" role="alert">{writeError || loadError}</p>
      )}
      {loading && <p className="feedback-note" role="status">Carregando seus lançamentos...</p>}

      <div className="transaction-grid print-hidden">
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
                setModeloReceitaSelecionado('');
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
              <label className="form-label" htmlFor="modelo-receita">Modelo de receita</label>
              <select
                className="form-select"
                id="modelo-receita"
                value={modeloReceitaSelecionado}
                onChange={(event) => {
                  const modeloId = event.target.value;
                  setModeloReceitaSelecionado(modeloId);
                  const modelo = modelosReceita.find((item) => item.id === modeloId);
                  if (modelo) setDescricaoReceita(modelo.name);
                }}
              >
                <option value="">Sem modelo</option>
                {modelosReceita.map((modelo) => (
                  <option value={modelo.id} key={modelo.id}>{modelo.name}</option>
                ))}
              </select>
            </div>

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

          <button
            className="button button-primary form-submit"
            type="submit"
            disabled={isSaving || loading || Boolean(loadError)}
          >
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
                {categoriasDespesa.map((categoria) => (
                  <option value={categoria} key={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="button button-expense form-submit"
            type="submit"
            disabled={isSaving || loading || Boolean(loadError)}
          >
            Adicionar despesa
          </button>
        </form>
      </div>

      <section className="surface-card finance-options-card print-hidden" aria-labelledby="finance-options-title">
        <div className="finance-options-heading">
          <h2 className="section-title" id="finance-options-title">Personalizar lançamentos</h2>
          <p className="section-description">
            Padronize suas despesas e deixe receitas frequentes prontas para selecionar.
          </p>
        </div>

        <div className="finance-options-grid">
          <div className="finance-option-column">
            <h3 className="finance-option-title">Categorias de despesas</h3>
            <form className="finance-option-form" onSubmit={cadastrarCategoria}>
              <label className="form-label" htmlFor="nova-categoria">Nova categoria</label>
              <div className="finance-option-input-row">
                <input
                  className="form-input"
                  id="nova-categoria"
                  type="text"
                  value={novaCategoria}
                  onChange={(event) => setNovaCategoria(event.target.value)}
                  placeholder="Ex.: Educação"
                  maxLength={50}
                  required
                />
                <button className="button button-secondary" type="submit" disabled={isSaving || loading || Boolean(loadError)}>
                  Adicionar
                </button>
              </div>
            </form>
            <ul className="finance-option-list">
              {DEFAULT_EXPENSE_CATEGORIES.map((categoria) => (
                <li className="finance-option-item" key={categoria}>
                  <span>{categoria}</span>
                  <span className="finance-option-default">Padrão</span>
                </li>
              ))}
              {categoriasPersonalizadas.map((categoria) => (
                <li className="finance-option-item" key={categoria.id}>
                  <span>{categoria.name}</span>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Excluir categoria ${categoria.name}`}
                    title={
                      categoriasEmUso.has(categoria.name)
                        ? 'Esta categoria já está sendo usada em lançamentos.'
                        : 'Excluir categoria'
                    }
                    disabled={isSaving || loading || Boolean(loadError) || categoriasEmUso.has(categoria.name)}
                    onClick={() => excluirCategoria(categoria)}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="finance-option-column">
            <h3 className="finance-option-title">Modelos de receita</h3>
            <form className="finance-option-form" onSubmit={cadastrarModeloReceita}>
              <label className="form-label" htmlFor="novo-modelo-receita">Nome do modelo</label>
              <div className="finance-option-input-row">
                <input
                  className="form-input"
                  id="novo-modelo-receita"
                  type="text"
                  value={novoModeloReceita}
                  onChange={(event) => setNovoModeloReceita(event.target.value)}
                  placeholder="Ex.: Salário dia 10"
                  maxLength={60}
                  required
                />
                <button className="button button-secondary" type="submit" disabled={isSaving || loading || Boolean(loadError)}>
                  Adicionar
                </button>
              </div>
            </form>
            {modelosReceita.length === 0 ? (
              <p className="empty-state finance-option-empty">
                Cadastre modelos como “Salário dia 10” para preencher rapidamente a descrição da receita.
              </p>
            ) : (
              <ul className="finance-option-list">
                {modelosReceita.map((modelo) => (
                  <li className="finance-option-item" key={modelo.id}>
                    <span>{modelo.name}</span>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Excluir modelo de receita ${modelo.name}`}
                      title="Excluir modelo de receita"
                      disabled={isSaving || loading || Boolean(loadError)}
                      onClick={() => excluirModeloReceita(modelo)}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="history-card" aria-labelledby="historico-title">
        <h2 className="section-title" id="historico-title">Histórico de lançamentos</h2>
        {transacoes.length === 0 ? (
          <p className="empty-state">Nenhuma receita ou despesa cadastrada ainda.</p>
        ) : (
          <ul className="history-list">
            {transacoes.map((item) => (
              <li className="history-item" key={item.id}>
                <div className="history-primary">
                  <strong className="history-description">{item.description}</strong>
                  <div className="history-meta">
                    {item.type === 'receita'
                      ? 'Receita'
                      : `Despesa · ${item.category || 'Sem categoria'}`}
                  </div>
                  <time className="history-date">{formatarData(item.createdAt)}</time>
                </div>
                <strong className={`history-amount ${item.type}`}>
                  {item.type === 'receita' ? '+' : '−'} {formatarMoeda(fromCents(item.amountCents))}
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
