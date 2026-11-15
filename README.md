# Finanças — controle pessoal

## Configuração do Firebase

O aplicativo usa Firebase Authentication e Cloud Firestore. Os dados ficam em
`users/{uid}` nas coleções `transactions`, `goals`, `assets`, `movements`,
`pixKeys`, `expenseCategories` e `incomePresets`; cada conta só pode acessar os
próprios documentos.

1. No Firebase Console, habilite os provedores **E-mail/senha** e **Google** em
   Authentication e adicione os domínios de desenvolvimento e produção em
   **Configurações > Domínios autorizados**. O domínio efetivo precisa estar
   autorizado tanto no Firebase Authentication quanto na configuração OAuth do
   Google, quando aplicável.
2. Crie o banco Cloud Firestore no projeto configurado em
   `src/services/firebase.js`.
3. Publique as regras incluídas neste repositório. Com o Firebase CLI instalado e
   autenticado, execute:

   ```sh
   firebase deploy --only firestore:rules --project fin-app-a0b9c
   ```

Os lançamentos, categorias de despesas, modelos de receita, metas, investimentos,
movimentações e chaves Pix são carregados e salvos por conta autenticada. O
dashboard permite alternar o gráfico mensal entre receitas, despesas e o modo
comparativo, além de filtrar despesas por várias categorias e consultar sua
distribuição por categoria. O filtro de categorias aparece somente no modo de
despesas. O cache persistente do Firestore mantém os dados
disponíveis após recarregar e pode sincronizar alterações feitas sem conexão quando
a internet voltar. As transferências de saldo exigem conexão para serem concluídas
de forma atômica.

## Exportar uma página em PDF

Em qualquer página autenticada, use **Exportar PDF**. Na janela do navegador ou
do dispositivo, escolha salvar como PDF ou compartilhar. O arquivo contém os
dados da página aberta, sem os formulários de edição. Na página de chaves Pix, o
aplicativo pede confirmação porque o PDF inclui as chaves completas.

## Login Google em dispositivos móveis

O app tenta primeiro autenticar com a janela do Google aberta pelo próprio
navegador, evitando problemas de armazenamento entre domínios no fluxo de
redirecionamento em Safari e navegadores móveis. Se o navegador bloquear essa
janela, o app tenta o redirecionamento como alternativa. Para essa alternativa,
o domínio do app deve estar autorizado no Firebase Authentication. Em hospedagem
fora do Firebase Hosting, o fluxo de redirecionamento pode também exigir uma
configuração de domínio/proxy conforme as [recomendações do Firebase](https://firebase.google.com/docs/auth/web/redirect-best-practices).
Em dispositivos móveis, abra o app no Safari ou Chrome em vez de um navegador
embutido em outro aplicativo.

## Desenvolvimento

Execute `npm install` e depois `npm run dev`.

---

## Informações do template Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
