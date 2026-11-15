import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  PiggyBank,
  Pencil,
  Target,
  Trash2,
  Wallet,
} from 'lucide-react';
import React, { useState } from 'react';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useUserCollection } from '../hooks/useUserCollection';
import { db } from '../services/firebase';
import {
  createUserRecord,
  firebaseErrorMessage,
  fromCents,
  toCents,
  updateUserRecord,
  userCollection,
  userDocument,
} from '../services/userData';

const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

const formatarData = (timestamp) => {
  const data = timestamp?.toDate?.();
  return data ? data.toLocaleString('pt-BR') : 'Salvando...';
};

export function Investimentos() {
  const { user } = useAuth();
  const metasState = useUserCollection('goals');
  const ativosState = useUserCollection('assets');
  const movimentacoesState = useUserCollection('movements');
  const [writeError, setWriteError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nomeMeta, setNomeMeta] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [aporteDestinoId, setAporteDestinoId] = useState('');
  const [nomeNovoAtivoAporte, setNomeNovoAtivoAporte] = useState('');
  const [valorAporte, setValorAporte] = useState('');
  const [origemTransferenciaId, setOrigemTransferenciaId] = useState('');
  const [destinoTransferenciaId, setDestinoTransferenciaId] = useState('');
  const [nomeNovoAtivoTransferencia, setNomeNovoAtivoTransferencia] = useState('');
  const [valorTransferencia, setValorTransferencia] = useState('');
  const [saldoUtilizacaoId, setSaldoUtilizacaoId] = useState('');
  const [valorUtilizacao, setValorUtilizacao] = useState('');
  const [contaEmEdicaoId, setContaEmEdicaoId] = useState('');
  const [nomeEmEdicao, setNomeEmEdicao] = useState('');
  const [valorAlvoEmEdicao, setValorAlvoEmEdicao] = useState('');

  const metas = metasState.documents.map((meta) => ({
    id: meta.id,
    nome: meta.name,
    valorAlvo: fromCents(meta.targetCents),
    valorGuardado: fromCents(meta.balanceCents),
  }));
  const ativos = ativosState.documents.map((ativo) => ({
    id: ativo.id,
    nome: ativo.name,
    saldo: fromCents(ativo.balanceCents),
  }));
  const movimentacoes = movimentacoesState.documents.map((movimentacao) => ({
    id: movimentacao.id,
    tipo: movimentacao.type,
    descricao: movimentacao.description,
    valor: fromCents(movimentacao.amountCents),
    data: formatarData(movimentacao.createdAt),
  }));
  const loading = metasState.loading || ativosState.loading || movimentacoesState.loading;
  const dataError = metasState.error || ativosState.error || movimentacoesState.error;
  const isReady = !loading && !dataError;

  const contas = [
    ...metas.map((meta) => ({
      id: `meta:${meta.id}`,
      tipo: 'meta',
      nome: meta.nome,
      saldo: meta.valorGuardado,
    })),
    ...ativos.map((ativo) => ({
      id: `ativo:${ativo.id}`,
      tipo: 'ativo',
      nome: ativo.nome,
      saldo: ativo.saldo,
    })),
  ];

  const executarOperacao = async (operacao, aposSucesso) => {
    setWriteError('');
    setIsSaving(true);
    try {
      await operacao();
      aposSucesso?.();
    } catch (error) {
      console.error('Não foi possível salvar a movimentação de investimento:', error);
      setWriteError(firebaseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCriarMeta = async (event) => {
    event.preventDefault();

    const nome = nomeMeta.trim();
    const alvoNumerico = Number(valorAlvo);
    if (!nome || !Number.isFinite(alvoNumerico) || alvoNumerico <= 0) {
      alert('Insira um nome válido e um valor alvo maior que zero para a meta.');
      return;
    }

    await executarOperacao(
      () => createUserRecord(user.uid, 'goals', {
        name: nome,
        targetCents: toCents(alvoNumerico),
        balanceCents: 0,
      }),
      () => {
        setNomeMeta('');
        setValorAlvo('');
      },
    );
  };

  const handleFazerAporte = async (event) => {
    event.preventDefault();

    const valorNumerico = Number(valorAporte);
    const nomeNovoAtivo = nomeNovoAtivoAporte.trim();
    const destino = contas.find((conta) => conta.id === aporteDestinoId);
    if (
      !aporteDestinoId ||
      !Number.isFinite(valorNumerico) ||
      valorNumerico <= 0 ||
      (aporteDestinoId === 'novo-ativo' && !nomeNovoAtivo) ||
      (aporteDestinoId !== 'novo-ativo' && !destino)
    ) {
      alert('Selecione um destino válido e informe uma descrição e um valor maior que zero.');
      return;
    }

    const valorCentavos = toCents(valorNumerico);
    const referenciaMovimentacao = doc(userCollection(user.uid, 'movements'));
    if (aporteDestinoId === 'novo-ativo') {
      const referenciaAtivo = doc(userCollection(user.uid, 'assets'));
      await executarOperacao(() => runTransaction(db, async (transaction) => {
        transaction.set(referenciaAtivo, {
          name: nomeNovoAtivo,
          balanceCents: valorCentavos,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.set(referenciaMovimentacao, {
          type: 'aporte',
          description: `Aporte inicial em ${nomeNovoAtivo}`,
          amountCents: valorCentavos,
          createdAt: serverTimestamp(),
        });
      }), () => {
        setNomeNovoAtivoAporte('');
        setAporteDestinoId('');
        setValorAporte('');
      });
    } else {
      const [tipo, id] = aporteDestinoId.split(':');
      const colecaoDestino = tipo === 'meta' ? 'goals' : 'assets';
      const referenciaDestino = userDocument(user.uid, colecaoDestino, id);
      await executarOperacao(() => runTransaction(db, async (transaction) => {
        const destinoSnapshot = await transaction.get(referenciaDestino);
        if (!destinoSnapshot.exists()) throw new Error('O destino do aporte não existe mais.');
        const saldoAtual = Number(destinoSnapshot.data().balanceCents ?? 0);
        transaction.update(referenciaDestino, {
          balanceCents: saldoAtual + valorCentavos,
          updatedAt: serverTimestamp(),
        });
        transaction.set(referenciaMovimentacao, {
          type: 'aporte',
          description: `Aporte em ${destino.nome}`,
          amountCents: valorCentavos,
          createdAt: serverTimestamp(),
        });
      }), () => {
        setAporteDestinoId('');
        setValorAporte('');
      });
    }
  };

  const handleTransferirSaldo = async (event) => {
    event.preventDefault();

    const valorNumerico = Number(valorTransferencia);
    const origem = contas.find((conta) => conta.id === origemTransferenciaId);
    const destino = contas.find((conta) => conta.id === destinoTransferenciaId);
    const nomeNovoAtivo = nomeNovoAtivoTransferencia.trim();
    if (
      !origem ||
      !destinoTransferenciaId ||
      !Number.isFinite(valorNumerico) ||
      valorNumerico <= 0 ||
      (destinoTransferenciaId === 'novo-ativo' && !nomeNovoAtivo) ||
      (destinoTransferenciaId !== 'novo-ativo' && !destino) ||
      valorNumerico > origem.saldo
    ) {
      alert('Confira a origem, o destino e o valor da transferência. O valor não pode exceder o saldo disponível.');
      return;
    }

    const valorCentavos = toCents(valorNumerico);
    const [tipoOrigem, idOrigem] = origem.id.split(':');
    const referenciaOrigem = userDocument(
      user.uid,
      tipoOrigem === 'meta' ? 'goals' : 'assets',
      idOrigem,
    );
    const referenciaDestino = destinoTransferenciaId === 'novo-ativo'
      ? doc(userCollection(user.uid, 'assets'))
      : userDocument(
        user.uid,
        destino.tipo === 'meta' ? 'goals' : 'assets',
        destino.id.split(':')[1],
      );
    const referenciaMovimentacao = doc(userCollection(user.uid, 'movements'));
    const descricao = `Transferência de ${origem.nome} para ${
      destinoTransferenciaId === 'novo-ativo' ? nomeNovoAtivo : destino.nome
    }`;

    await executarOperacao(() => runTransaction(db, async (transaction) => {
      const origemSnapshot = await transaction.get(referenciaOrigem);
      if (!origemSnapshot.exists()) throw new Error('A origem da transferência não existe mais.');

      const destinoSnapshot = destinoTransferenciaId === 'novo-ativo'
        ? null
        : await transaction.get(referenciaDestino);
      if (destinoSnapshot && !destinoSnapshot.exists()) {
        throw new Error('O destino da transferência não existe mais.');
      }

      const saldoOrigem = Number(origemSnapshot.data().balanceCents ?? 0);
      if (valorCentavos > saldoOrigem) {
        throw new Error('O valor não pode exceder o saldo disponível.');
      }

      transaction.update(referenciaOrigem, {
        balanceCents: saldoOrigem - valorCentavos,
        updatedAt: serverTimestamp(),
      });
      if (destinoTransferenciaId === 'novo-ativo') {
        transaction.set(referenciaDestino, {
          name: nomeNovoAtivo,
          balanceCents: valorCentavos,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        transaction.update(referenciaDestino, {
          balanceCents: Number(destinoSnapshot.data().balanceCents ?? 0) + valorCentavos,
          updatedAt: serverTimestamp(),
        });
      }
      transaction.set(referenciaMovimentacao, {
        type: 'transferencia',
        description: descricao,
        amountCents: valorCentavos,
        createdAt: serverTimestamp(),
      });
    }), () => {
      setNomeNovoAtivoTransferencia('');
      setOrigemTransferenciaId('');
      setDestinoTransferenciaId('');
      setValorTransferencia('');
    });
  };

  const handleUtilizarSaldo = async (event) => {
    event.preventDefault();

    const valorNumerico = Number(valorUtilizacao);
    const conta = contas.find((item) => item.id === saldoUtilizacaoId);
    if (
      !conta ||
      !Number.isFinite(valorNumerico) ||
      valorNumerico <= 0 ||
      valorNumerico > conta.saldo
    ) {
      alert('Selecione um recurso e informe um valor válido que não ultrapasse o saldo disponível.');
      return;
    }

    const [tipo, id] = conta.id.split(':');
    const referenciaConta = userDocument(
      user.uid,
      tipo === 'meta' ? 'goals' : 'assets',
      id,
    );
    const referenciaMovimentacao = doc(userCollection(user.uid, 'movements'));
    const valorCentavos = toCents(valorNumerico);

    await executarOperacao(() => runTransaction(db, async (transaction) => {
      const contaSnapshot = await transaction.get(referenciaConta);
      if (!contaSnapshot.exists()) throw new Error('O recurso escolhido não existe mais.');
      const saldoAtual = Number(contaSnapshot.data().balanceCents ?? 0);
      if (valorCentavos > saldoAtual) {
        throw new Error('O valor não pode exceder o saldo disponível.');
      }
      transaction.update(referenciaConta, {
        balanceCents: saldoAtual - valorCentavos,
        updatedAt: serverTimestamp(),
      });
      transaction.set(referenciaMovimentacao, {
        type: 'utilizacao',
        description: `Saldo utilizado de ${conta.nome}`,
        amountCents: valorCentavos,
        createdAt: serverTimestamp(),
      });
    }), () => {
      setSaldoUtilizacaoId('');
      setValorUtilizacao('');
    });
  };

  const iniciarEdicao = (conta) => {
    setContaEmEdicaoId(conta.id);
    setNomeEmEdicao(conta.nome);
    setValorAlvoEmEdicao(
      conta.tipo === 'meta'
        ? metas.find((meta) => `meta:${meta.id}` === conta.id).valorAlvo.toString()
        : '',
    );
  };

  const handleSalvarEdicao = async (event) => {
    event.preventDefault();

    const nome = nomeEmEdicao.trim();
    const conta = contas.find((item) => item.id === contaEmEdicaoId);
    const alvoNumerico = Number(valorAlvoEmEdicao);
    if (
      !conta ||
      !nome ||
      (conta.tipo === 'meta' && (!Number.isFinite(alvoNumerico) || alvoNumerico <= 0))
    ) {
      alert('Informe um nome válido e, para metas, um valor desejado maior que zero.');
      return;
    }

    const [tipo, id] = conta.id.split(':');
    const colecao = tipo === 'meta' ? 'goals' : 'assets';
    const dados = tipo === 'meta'
      ? { name: nome, targetCents: toCents(alvoNumerico) }
      : { name: nome };
    await executarOperacao(
      () => updateUserRecord(user.uid, colecao, id, dados),
      () => {
        setContaEmEdicaoId('');
        setNomeEmEdicao('');
        setValorAlvoEmEdicao('');
      },
    );
  };

  const handleExcluirConta = async (conta) => {
    if (conta.saldo > 0) return;
    if (!window.confirm(`Deseja excluir "${conta.nome}"?`)) return;

    const [tipo, id] = conta.id.split(':');
    const referencia = userDocument(
      user.uid,
      tipo === 'meta' ? 'goals' : 'assets',
      id,
    );
    await executarOperacao(() => runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(referencia);
      if (!snapshot.exists()) throw new Error('Este recurso já foi removido.');
      if (Number(snapshot.data().balanceCents ?? 0) > 0) {
        throw new Error('Transfira ou utilize o saldo antes de excluir este recurso.');
      }
      transaction.delete(referencia);
    }), () => {
      if (contaEmEdicaoId === conta.id) setContaEmEdicaoId('');
      if (aporteDestinoId === conta.id) setAporteDestinoId('');
      if (origemTransferenciaId === conta.id) setOrigemTransferenciaId('');
      if (destinoTransferenciaId === conta.id) setDestinoTransferenciaId('');
      if (saldoUtilizacaoId === conta.id) setSaldoUtilizacaoId('');
    });
  };

  const renderEdicao = (conta) => {
    if (contaEmEdicaoId !== conta.id) return null;

    return (
      <form className="resource-edit-form" onSubmit={handleSalvarEdicao}>
        <div className="form-field">
          <label className="form-label" htmlFor={`nome-edicao-${conta.id}`}>Nome</label>
          <input
            className="form-input"
            id={`nome-edicao-${conta.id}`}
            value={nomeEmEdicao}
            onChange={(event) => setNomeEmEdicao(event.target.value)}
            required
          />
        </div>
        {conta.tipo === 'meta' && (
          <div className="form-field">
            <label className="form-label" htmlFor={`alvo-edicao-${conta.id}`}>Valor desejado (R$)</label>
            <input
              className="form-input"
              id={`alvo-edicao-${conta.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={valorAlvoEmEdicao}
              onChange={(event) => setValorAlvoEmEdicao(event.target.value)}
              required
            />
          </div>
        )}
        <div className="resource-actions">
          <button className="button button-primary" type="submit">Salvar alterações</button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setContaEmEdicaoId('')}
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  };

  const totalMetas = metas.reduce((total, meta) => total + meta.valorGuardado, 0);
  const totalAtivos = ativos.reduce((total, ativo) => total + ativo.saldo, 0);
  const totalAcompanhado = totalMetas + totalAtivos;

  return (
    <div>
      <header className="page-header">
        <p className="page-kicker">Planejamento</p>
        <h1 className="page-title">Investimentos e metas</h1>
        <p className="page-description">
          Acompanhe seus recursos, movimente saldos e ajuste seus objetivos quando precisar.
        </p>
      </header>

      {(writeError || dataError) && (
        <p className="feedback-error" role="alert">{writeError || dataError}</p>
      )}
      {loading && <p className="feedback-note" role="status">Carregando seus investimentos e metas...</p>}

      <section className="dashboard-grid investment-summary-grid" aria-label="Resumo dos recursos">
        <article className="summary-card">
          <div className="summary-card-top">
            <p className="summary-label">Guardado em metas</p>
            <span className="summary-icon balance"><Target size={20} aria-hidden="true" /></span>
          </div>
          <strong className="summary-value">{formatarMoeda(totalMetas)}</strong>
        </article>
        <article className="summary-card">
          <div className="summary-card-top">
            <p className="summary-label">Em investimentos e ativos</p>
            <span className="summary-icon income"><PiggyBank size={20} aria-hidden="true" /></span>
          </div>
          <strong className="summary-value">{formatarMoeda(totalAtivos)}</strong>
        </article>
        <article className="summary-card">
          <div className="summary-card-top">
            <p className="summary-label">Total acompanhado</p>
            <span className="summary-icon expense"><Wallet size={20} aria-hidden="true" /></span>
          </div>
          <strong className="summary-value">{formatarMoeda(totalAcompanhado)}</strong>
        </article>
      </section>

      <section className="surface-card investment-section print-hidden" aria-labelledby="nova-meta-title">
        <div className="section-heading">
          <span className="section-icon balance"><Target size={21} aria-hidden="true" /></span>
          <div>
            <h2 className="section-title" id="nova-meta-title">Criar nova meta</h2>
            <p className="section-description">Dê um nome e defina quanto deseja juntar.</p>
          </div>
        </div>

        <form className="investment-form-grid" onSubmit={handleCriarMeta}>
          <div className="form-field">
            <label className="form-label" htmlFor="nome-meta">Nome da meta</label>
            <input
              className="form-input"
              id="nome-meta"
              type="text"
              value={nomeMeta}
              onChange={(event) => setNomeMeta(event.target.value)}
              placeholder="Ex.: reserva de emergência"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="valor-alvo">Valor desejado (R$)</label>
            <input
              className="form-input"
              id="valor-alvo"
              type="number"
              step="0.01"
              min="0.01"
              value={valorAlvo}
              onChange={(event) => setValorAlvo(event.target.value)}
              placeholder="0,00"
              required
            />
          </div>
          <button
            className="button button-primary"
            type="submit"
            disabled={isSaving || !isReady}
          >
            Criar meta
          </button>
        </form>
      </section>

      <section className="surface-card investment-section print-hidden" aria-labelledby="aporte-title">
        <div className="section-heading">
          <span className="section-icon income"><ArrowUpRight size={21} aria-hidden="true" /></span>
          <div>
            <h2 className="section-title" id="aporte-title">Registrar aporte</h2>
            <p className="section-description">Adicione um aporte a uma meta ou investimento existente.</p>
          </div>
        </div>

        <form className="investment-form-grid" onSubmit={handleFazerAporte}>
          <div className="form-field">
            <label className="form-label" htmlFor="aporte-destino">Destino do aporte</label>
            <select
              className="form-select"
              id="aporte-destino"
              value={aporteDestinoId}
              onChange={(event) => setAporteDestinoId(event.target.value)}
              required
            >
              <option value="">Selecione um destino</option>
              {metas.map((meta) => (
                <option key={meta.id} value={`meta:${meta.id}`}>Meta · {meta.nome}</option>
              ))}
              {ativos.map((ativo) => (
                <option key={ativo.id} value={`ativo:${ativo.id}`}>Investimento · {ativo.nome}</option>
              ))}
              <option value="novo-ativo">Novo investimento ou ativo</option>
            </select>
          </div>
          {aporteDestinoId === 'novo-ativo' && (
            <div className="form-field">
              <label className="form-label" htmlFor="novo-ativo-aporte">Nome do investimento ou ativo</label>
              <input
                className="form-input"
                id="novo-ativo-aporte"
                value={nomeNovoAtivoAporte}
                onChange={(event) => setNomeNovoAtivoAporte(event.target.value)}
                placeholder="Ex.: CDB, Tesouro Direto"
                required
              />
            </div>
          )}
          <div className="form-field">
            <label className="form-label" htmlFor="valor-aporte">Valor do aporte (R$)</label>
            <input
              className="form-input"
              id="valor-aporte"
              type="number"
              step="0.01"
              min="0.01"
              value={valorAporte}
              onChange={(event) => setValorAporte(event.target.value)}
              placeholder="0,00"
              required
            />
          </div>
          <button
            className="button button-primary investment-form-submit"
            type="submit"
            disabled={isSaving || !isReady}
          >
            Registrar aporte
          </button>
        </form>
      </section>

      <section className="surface-card investment-section print-hidden" aria-labelledby="transferir-title">
        <div className="section-heading">
          <span className="section-icon balance"><ArrowLeftRight size={21} aria-hidden="true" /></span>
          <div>
            <h2 className="section-title" id="transferir-title">Transferir entre recursos</h2>
            <p className="section-description">Mova saldo entre metas e investimentos ou crie um novo destino.</p>
          </div>
        </div>

        <form className="investment-form-grid" onSubmit={handleTransferirSaldo}>
          <div className="form-field">
            <label className="form-label" htmlFor="origem-transferencia">Origem</label>
            <select
              className="form-select"
              id="origem-transferencia"
              value={origemTransferenciaId}
              onChange={(event) => {
                setOrigemTransferenciaId(event.target.value);
                setDestinoTransferenciaId('');
              }}
              required
            >
              <option value="">Selecione a origem</option>
              {contas.filter((conta) => conta.saldo > 0).map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.tipo === 'meta' ? 'Meta' : 'Investimento'} · {conta.nome} ({formatarMoeda(conta.saldo)})
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="destino-transferencia">Destino</label>
            <select
              className="form-select"
              id="destino-transferencia"
              value={destinoTransferenciaId}
              onChange={(event) => setDestinoTransferenciaId(event.target.value)}
              required
            >
              <option value="">Selecione o destino</option>
              {contas.filter((conta) => conta.id !== origemTransferenciaId).map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.tipo === 'meta' ? 'Meta' : 'Investimento'} · {conta.nome}
                </option>
              ))}
              <option value="novo-ativo">Novo investimento ou ativo</option>
            </select>
          </div>
          {destinoTransferenciaId === 'novo-ativo' && (
            <div className="form-field">
              <label className="form-label" htmlFor="novo-ativo-transferencia">Nome do investimento ou ativo</label>
              <input
                className="form-input"
                id="novo-ativo-transferencia"
                value={nomeNovoAtivoTransferencia}
                onChange={(event) => setNomeNovoAtivoTransferencia(event.target.value)}
                placeholder="Ex.: CDB, Tesouro Direto"
                required
              />
            </div>
          )}
          <div className="form-field">
            <label className="form-label" htmlFor="valor-transferencia">Valor da transferência (R$)</label>
            <input
              className="form-input"
              id="valor-transferencia"
              type="number"
              step="0.01"
              min="0.01"
              max={contas.find((conta) => conta.id === origemTransferenciaId)?.saldo}
              value={valorTransferencia}
              onChange={(event) => setValorTransferencia(event.target.value)}
              placeholder="0,00"
              required
            />
          </div>
          <button
            className="button button-primary investment-form-submit"
            type="submit"
            disabled={isSaving || !isReady}
          >
            <ArrowLeftRight size={17} aria-hidden="true" />
            Transferir saldo
          </button>
        </form>
      </section>

      <section className="surface-card investment-section print-hidden" aria-labelledby="utilizar-title">
        <div className="section-heading">
          <span className="section-icon expense"><ArrowDownRight size={21} aria-hidden="true" /></span>
          <div>
            <h2 className="section-title" id="utilizar-title">Utilizar saldo guardado</h2>
            <p className="section-description">O valor escolhido será descontado do recurso, sem criar uma despesa.</p>
          </div>
        </div>

        <form className="investment-form-grid" onSubmit={handleUtilizarSaldo}>
          <div className="form-field">
            <label className="form-label" htmlFor="saldo-utilizacao">Recurso</label>
            <select
              className="form-select"
              id="saldo-utilizacao"
              value={saldoUtilizacaoId}
              onChange={(event) => setSaldoUtilizacaoId(event.target.value)}
              required
            >
              <option value="">Selecione um recurso</option>
              {contas.filter((conta) => conta.saldo > 0).map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.tipo === 'meta' ? 'Meta' : 'Investimento'} · {conta.nome} ({formatarMoeda(conta.saldo)})
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="valor-utilizacao">Valor a utilizar (R$)</label>
            <input
              className="form-input"
              id="valor-utilizacao"
              type="number"
              min="0.01"
              step="0.01"
              max={contas.find((conta) => conta.id === saldoUtilizacaoId)?.saldo}
              value={valorUtilizacao}
              onChange={(event) => setValorUtilizacao(event.target.value)}
              placeholder="0,00"
              required
            />
          </div>
          <button
            className="button button-expense investment-form-submit"
            type="submit"
            disabled={isSaving || !isReady}
          >
            Utilizar saldo
          </button>
        </form>
      </section>

      <section className="surface-card investment-section" aria-labelledby="metas-title">
        <h2 className="section-title" id="metas-title">Metas e recursos</h2>
        {metas.length === 0 ? (
          <p className="empty-state">Nenhuma meta cadastrada no momento.</p>
        ) : (
          <ul className="goal-list">
            {metas.map((meta) => {
              const progresso = Math.min(Math.round((meta.valorGuardado / meta.valorAlvo) * 100), 100);
              const conta = {
                id: `meta:${meta.id}`,
                tipo: 'meta',
                nome: meta.nome,
                saldo: meta.valorGuardado,
              };

              return (
                <li className="goal-card" key={meta.id}>
                  <div className="goal-card-top">
                    <strong className="goal-name">{meta.nome}</strong>
                    <span className="goal-amounts">
                      {formatarMoeda(meta.valorGuardado)} de {formatarMoeda(meta.valorAlvo)} · {progresso}%
                    </span>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label={`Progresso da meta ${meta.nome}`}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={progresso}
                  >
                    <div className="progress-value" style={{ width: `${progresso}%` }} />
                  </div>
                  <div className="resource-actions">
                    <button className="button button-secondary" type="button" disabled={isSaving || !isReady} onClick={() => iniciarEdicao(conta)}>
                      <Pencil size={16} aria-hidden="true" />
                      Editar meta
                    </button>
                    <button
                      className="button button-danger"
                      type="button"
                      disabled={meta.valorGuardado > 0 || isSaving || !isReady}
                      title={meta.valorGuardado > 0 ? 'Transfira ou utilize o saldo antes de excluir.' : undefined}
                      onClick={() => handleExcluirConta(conta)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Excluir meta
                    </button>
                  </div>
                  {meta.valorGuardado > 0 && (
                    <p className="resource-note">Transfira ou utilize o saldo antes de excluir esta meta.</p>
                  )}
                  {renderEdicao(conta)}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="surface-card investment-section" aria-labelledby="ativos-title">
        <h2 className="section-title" id="ativos-title">Investimentos e ativos</h2>
        {ativos.length === 0 ? (
          <p className="empty-state">
            Ainda não há investimentos cadastrados. Crie um ao registrar um aporte ou transferir saldo.
          </p>
        ) : (
          <ul className="goal-list">
            {ativos.map((ativo) => {
              const conta = {
                id: `ativo:${ativo.id}`,
                tipo: 'ativo',
                nome: ativo.nome,
                saldo: ativo.saldo,
              };

              return (
                <li className="goal-card" key={ativo.id}>
                  <div className="goal-card-top">
                    <strong className="goal-name">{ativo.nome}</strong>
                    <span className="goal-amounts">{formatarMoeda(ativo.saldo)} acompanhado</span>
                  </div>
                  <div className="resource-actions">
                    <button className="button button-secondary" type="button" disabled={isSaving || !isReady} onClick={() => iniciarEdicao(conta)}>
                      <Pencil size={16} aria-hidden="true" />
                      Editar recurso
                    </button>
                    <button
                      className="button button-danger"
                      type="button"
                      disabled={ativo.saldo > 0 || isSaving || !isReady}
                      title={ativo.saldo > 0 ? 'Transfira ou utilize o saldo antes de excluir.' : undefined}
                      onClick={() => handleExcluirConta(conta)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Excluir recurso
                    </button>
                  </div>
                  {ativo.saldo > 0 && (
                    <p className="resource-note">Transfira ou utilize o saldo antes de excluir este recurso.</p>
                  )}
                  {renderEdicao(conta)}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="surface-card" aria-labelledby="movimentacoes-title">
        <h2 className="section-title" id="movimentacoes-title">Movimentações recentes</h2>
        {movimentacoes.length === 0 ? (
          <p className="empty-state">Aportes, transferências e utilizações aparecerão aqui.</p>
        ) : (
          <ul className="movement-list">
            {movimentacoes.map((movimentacao) => (
              <li className="movement-item" key={movimentacao.id}>
                <div className="movement-copy">
                  <strong>{movimentacao.descricao}</strong>
                  <time>{movimentacao.data}</time>
                </div>
                <span className={`movement-amount ${movimentacao.tipo}`}>
                  {movimentacao.tipo === 'aporte' && <ArrowUpRight size={16} aria-hidden="true" />}
                  {movimentacao.tipo === 'utilizacao' && <ArrowDownRight size={16} aria-hidden="true" />}
                  {formatarMoeda(movimentacao.valor)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Investimentos;
