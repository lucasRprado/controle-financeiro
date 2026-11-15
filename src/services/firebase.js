// Importa as funções necessárias do SDK do Firebase para inicializar o app e o Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Objeto de configuração contendo as credenciais do seu projeto Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyATRhpgkWqIDpkoyd1Xg-d5Vc7sRnH5w_Q",
  authDomain: "fin-app-a0b9c.firebaseapp.com",
  projectId: "fin-app-a0b9c",
  storageBucket: "fin-app-a0b9c.firebasestorage.app",
  messagingSenderId: "880315529064",
  appId: "1:880315529064:web:983fd6f35ab02e9a0e48dd"
}

// Inicializa o aplicativo Firebase com as configurações informadas acima
const app = initializeApp(firebaseConfig);

// Inicializa e exporta o serviço do Firestore (Banco de Dados NoSQL)
// Este objeto 'db' será importado nas telas para buscar, salvar e atualizar dados.
export const db = getFirestore(app);