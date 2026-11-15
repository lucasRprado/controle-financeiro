# Finanças — controle pessoal

## Configuração do Firebase

O aplicativo usa Firebase Authentication e Cloud Firestore. Os dados ficam em
`users/{uid}` nas coleções `transactions`, `goals`, `assets`, `movements` e
`pixKeys`; cada conta só pode acessar os próprios documentos.

1. No Firebase Console, habilite os provedores **E-mail/senha** e **Google** em
   Authentication e adicione os domínios de desenvolvimento e produção em
   **Configurações > Domínios autorizados**.
2. Crie o banco Cloud Firestore no projeto configurado em
   `src/services/firebase.js`.
3. Publique as regras incluídas neste repositório. Com o Firebase CLI instalado e
   autenticado, execute:

   ```sh
   firebase deploy --only firestore:rules --project fin-app-a0b9c
   ```

Os lançamentos, metas, investimentos, movimentações e chaves Pix são carregados e
salvos por conta autenticada. O cache persistente do Firestore mantém os dados
disponíveis após recarregar e pode sincronizar alterações feitas sem conexão quando
a internet voltar. As transferências de saldo exigem conexão para serem concluídas
de forma atômica.

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
