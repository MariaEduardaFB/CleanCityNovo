import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'local_users';
const CURRENT_USER_KEY = 'current_user';

export interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  password: string; // Hash em produção real
  createdAt: string;
  isAdmin?: boolean;
}

export async function signUpLocal(
  email: string,
  password: string,
  displayName: string
): Promise<LocalUser> {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users: LocalUser[] = usersJson ? JSON.parse(usersJson) : [];

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('Este email já está cadastrado');
    }

    const newUser: LocalUser = {
      uid: `local_${Date.now()}`,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      password,
      createdAt: new Date().toISOString(),
      isAdmin: email.trim().toLowerCase() === 'admin@cleancity.com',
    };

    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    console.log('✅ Usuário criado:', newUser.email);
    return newUser;
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    throw error;
  }
}

export async function signInLocal(
  email: string,
  password: string
): Promise<LocalUser> {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users: LocalUser[] = usersJson ? JSON.parse(usersJson) : [];

    const user = users.find(
      u => u.email === email.trim().toLowerCase() && u.password === password
    );

    if (!user) {
      throw new Error('Email ou senha incorretos');
    }

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    console.log('✅ Login realizado:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error);
    throw error;
  }
}

export async function signOutLocal(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    console.log('✅ Logout realizado');
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    throw error;
  }
}

export async function getCurrentUserLocal(): Promise<LocalUser | null> {
  try {
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário atual:', error);
    return null;
  }
}

export function onAuthStateChangeLocal(
  callback: (user: LocalUser | null) => void
): () => void {
  let interval: any;

  const checkUser = async () => {
    const user = await getCurrentUserLocal();
    callback(user);
  };

  checkUser();

  interval = setInterval(checkUser, 1000);

  return () => {
    if (interval) clearInterval(interval);
  };
}

export async function getAllUsersLocal(): Promise<LocalUser[]> {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    return [];
  }
}

export async function deleteUserLocal(uid: string): Promise<void> {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users: LocalUser[] = usersJson ? JSON.parse(usersJson) : [];

    const updatedUsers = users.filter(u => u.uid !== uid);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

    const currentUser = await getCurrentUserLocal();
    if (currentUser?.uid === uid) {
      await signOutLocal();
    }

    console.log('✅ Usuário deletado');
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    throw error;
  }
}
