import { Check, Copy, KeyRound, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserCollection } from '../hooks/useUserCollection';
import {
  createUserRecord,
  deleteUserRecord,
  firebaseErrorMessage,
} from '../services/userData';

const tipoChaveLabel = {
  cpf: 'CPF',
  celular: 'Celular',
  email: 'E-mail',
  aleatoria: 'Aleatória',
};

export function PixKeys() {
  const { user } = useAuth();
  const { documents: chaves, loading, error: loadError } = useUserCollection('pixKeys');
  const [banco, setBanco] = useState('');
  const [tipo, setTipo] = useState('cpf');
  const [valorChave, setValorChave] = useState('');
  const [copiadoId, setCopiadoId] = useState(null);
  const [writeError, setWriteError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const aplicarMascara = (texto, tipoChave) => {
    const apenasNumeros = texto.replace(/\D/g, '');

    if (tipoChave === 'cpf') {
      return apenasNumeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    }

    if (tipoChave === 'celular') {
      return apenasNumeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    }

    return texto;
  };

  const handleCadastrarChave = async (event) => {
    event.preventDefault();

    if (!banco.trim() || !valorChave.trim()) {
      alert('Por favor, informe o nome do banco e preencha a chave Pix.');
      return;
    }

    setWriteError('');
    setIsSaving(true);
    try {
      await createUserRecord(user.uid, 'pixKeys', {
        bank: banco.trim(),
        type: tipo,
        value: valorChave.trim(),
      });
      setBanco('');
      setValorChave('');
    } catch (error) {
      console.error('Não foi possível salvar a chave Pix:', error);
      setWriteError(firebaseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopiarChave = async (id, valor) => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('A cópia não está disponível neste navegador.');
      }
      await navigator.clipboard.writeText(valor);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar chave:', error);
      setWriteError(error.message || 'Não foi possível copiar a chave.');
    }
  };

  const handleExcluirChave = async (id) => {
    setWriteError('');
    try {
      await deleteUserRecord(user.uid, 'pixKeys', id);
    } catch (error) {
      console.error('Não foi possível excluir a chave Pix:', error);
      setWriteError(firebaseErrorMessage(error));
    }
  };

  return (
    <div>
      <header className="page-header">
        <p className="page-kicker">Acesso rápido</p>
        <h1 className="page-title">Chaves Pix</h1>
        <p className="page-description">
          Organize suas chaves por banco e copie-as quando precisar.
        </p>
      </header>

      {(writeError || loadError) && (
        <p className="feedback-error" role="alert">{writeError || loadError}</p>
      )}
      {loading && <p className="feedback-note" role="status">Carregando suas chaves Pix...</p>}

      <form className="surface-card pix-form-card" onSubmit={handleCadastrarChave}>
        <div className="section-heading">
          <span className="section-icon balance">
            <KeyRound size={21} aria-hidden="true" />
          </span>
          <div>
            <h2 className="section-title">Cadastrar chave</h2>
            <p className="section-description">Informe a instituição e os dados da chave Pix.</p>
          </div>
        </div>

        <div className="pix-form-grid">
          <div className="form-field">
            <label className="form-label" htmlFor="banco">Banco ou instituição</label>
            <input
              className="form-input"
              id="banco"
              type="text"
              value={banco}
              onChange={(event) => setBanco(event.target.value)}
              placeholder="Ex.: Itaú, Nubank"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="tipo-chave">Tipo de chave</label>
            <select
              className="form-select"
              id="tipo-chave"
              value={tipo}
              onChange={(event) => {
                setTipo(event.target.value);
                setValorChave('');
              }}
            >
              <option value="cpf">CPF</option>
              <option value="celular">Celular</option>
              <option value="email">E-mail</option>
              <option value="aleatoria">Chave aleatória (UUID)</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="valor-chave">Valor da chave</label>
          <input
            className="form-input"
            id="valor-chave"
            type="text"
            value={valorChave}
            onChange={(event) => setValorChave(aplicarMascara(event.target.value, tipo))}
            placeholder={
              tipo === 'cpf' ? '000.000.000-00' :
              tipo === 'celular' ? '(00) 00000-0000' :
              tipo === 'email' ? 'exemplo@email.com' : 'Cole a chave aleatória'
            }
            required
          />
        </div>

        <button
          className="button button-primary form-submit"
          type="submit"
          disabled={isSaving || loading || Boolean(loadError)}
        >
          Salvar chave Pix
        </button>
      </form>

      <section className="surface-card pix-list-card" aria-labelledby="chaves-salvas-title">
        <h2 className="section-title" id="chaves-salvas-title">Chaves salvas</h2>
        {chaves.length === 0 ? (
          <p className="empty-state">Nenhuma chave Pix cadastrada ainda.</p>
        ) : (
          <ul className="pix-key-list">
            {chaves.map((item) => (
              <li className="pix-key-item" key={item.id}>
                <div>
                  <span className="key-bank">{item.bank}</span>
                  <strong className="key-value">{item.value}</strong>
                  <span className="key-type">{tipoChaveLabel[item.type] ?? item.type}</span>
                </div>

                <div className="key-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => handleCopiarChave(item.id, item.value)}
                    aria-label={copiadoId === item.id ? 'Chave Pix copiada' : `Copiar chave Pix ${tipoChaveLabel[item.type] ?? item.type}`}
                  >
                    {copiadoId === item.id ? (
                      <><Check size={17} aria-hidden="true" /> Copiada</>
                    ) : (
                      <><Copy size={17} aria-hidden="true" /> Copiar</>
                    )}
                  </button>
                  <button
                    className="button button-danger"
                    type="button"
                    onClick={() => handleExcluirChave(item.id)}
                    aria-label={`Excluir chave Pix ${tipoChaveLabel[item.type] ?? item.type}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default PixKeys;
