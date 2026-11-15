import { Download, Smartphone, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function InstallApp({ placement = 'sidebar' }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    const standalone = window.matchMedia('(display-mode: standalone)');
    return standalone.matches || window.navigator.standalone === true;
  });
  const [isIOS] = useState(() =>
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1),
  );
  const [showInstructions, setShowInstructions] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)');
    const updateInstalledState = () => {
      setIsInstalled(standalone.matches || window.navigator.standalone === true);
    };
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standalone.addEventListener?.('change', updateInstalledState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standalone.removeEventListener?.('change', updateInstalledState);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showInstructions && !dialog.open) {
      dialog.showModal();
    } else if (!showInstructions && dialog.open) {
      dialog.close();
    }
  }, [showInstructions]);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (outcome === 'accepted') setIsInstalled(true);
    } catch (error) {
      console.error('Não foi possível iniciar a instalação do aplicativo:', error);
      setInstallPrompt(null);
      setShowInstructions(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        className={placement === 'auth' ? 'auth-install-button' : 'sidebar-install-button'}
        type="button"
        onClick={handleInstall}
      >
        {isIOS ? (
          <Smartphone size={18} aria-hidden="true" />
        ) : (
          <Download size={18} aria-hidden="true" />
        )}
        <span>{isIOS ? 'Adicionar à tela inicial' : 'Instalar aplicativo'}</span>
      </button>

      <dialog
        className="install-dialog"
        ref={dialogRef}
        aria-labelledby="install-dialog-title"
        onClose={() => setShowInstructions(false)}
      >
        <div className="install-dialog-header">
          <span className="section-icon balance">
            {isIOS ? (
              <Smartphone size={21} aria-hidden="true" />
            ) : (
              <Download size={21} aria-hidden="true" />
            )}
          </span>
          <button
            className="install-dialog-close"
            type="button"
            aria-label="Fechar instruções"
            onClick={() => setShowInstructions(false)}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <h2 className="section-title" id="install-dialog-title">
          {isIOS ? 'Adicionar à Tela de Início' : 'Instalar o aplicativo'}
        </h2>
        {isIOS ? (
          <>
            <p className="install-dialog-copy">
              No Safari, toque em <strong>Compartilhar</strong>, escolha{' '}
              <strong>Adicionar à Tela de Início</strong> e confirme em <strong>Adicionar</strong>.
            </p>
            <p className="install-dialog-copy">
              O ícone do Finanças ficará disponível na tela inicial e abrirá em modo de aplicativo.
            </p>
          </>
        ) : (
          <p className="install-dialog-copy">
            Use o ícone de instalação na barra de endereços ou o menu do navegador e escolha
            {' '}<strong>Instalar aplicativo</strong>. Se essa opção não aparecer, tente abrir este
            site no Chrome ou Edge.
          </p>
        )}

        <button
          className="button button-primary install-dialog-action"
          type="button"
          onClick={() => setShowInstructions(false)}
        >
          Entendi
        </button>
      </dialog>
    </>
  );
}

export default InstallApp;
