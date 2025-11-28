import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
  lastLogin: any;
  registrationsCount: number;
}

/**
 * Cria perfil de usuário no Firestore
 */
async function createUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      registrationsCount: 0,
    });
  } else {
    // Atualiza último login
    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
  }
}

/**
 * Registra novo usuário com email e senha
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Atualiza nome de exibição
    await updateProfile(user, { displayName });

    // Cria perfil no Firestore
    await createUserProfile(user);

    console.log('✅ Usuário criado com sucesso:', user.uid);
    return user;
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Faz login com email e senha
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Atualiza último login
    await createUserProfile(user);

    console.log('✅ Login realizado:', user.uid);
    return user;
  } catch (error: any) {
    console.error('❌ Erro ao fazer login:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Faz login com Google (apenas web)
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Cria/atualiza perfil no Firestore
    await createUserProfile(user);

    console.log('✅ Login com Google realizado:', user.uid);
    return user;
  } catch (error: any) {
    console.error('❌ Erro ao fazer login com Google:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Desloga o usuário atual
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    console.log('✅ Logout realizado');
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    throw error;
  }
}

/**
 * Envia email de recuperação de senha
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Email de recuperação enviado para:', email);
  } catch (error: any) {
    console.error('❌ Erro ao enviar email de recuperação:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Obtém perfil do usuário do Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar perfil do usuário:', error);
    return null;
  }
}

/**
 * Observa mudanças no estado de autenticação
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Obtém o usuário atual
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Converte códigos de erro do Firebase em mensagens amigáveis
 */
function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    'auth/email-already-in-use': 'Este email já está cadastrado',
    'auth/invalid-email': 'Email inválido',
    'auth/operation-not-allowed': 'Operação não permitida',
    'auth/weak-password': 'Senha muito fraca. Use no mínimo 6 caracteres',
    'auth/user-disabled': 'Esta conta foi desabilitada',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
    'auth/popup-closed-by-user': 'Login cancelado pelo usuário',
  };

  return errorMessages[errorCode] || 'Erro ao autenticar. Tente novamente';
}
