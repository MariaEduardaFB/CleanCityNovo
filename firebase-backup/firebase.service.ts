import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { getCurrentUser } from './auth.service';
import type { WasteLocation } from '@/utils/storage';

export interface FirebaseWasteLocation extends Omit<WasteLocation, 'id' | 'timestamp'> {
  id?: string;
  userId: string;
  userName: string;
  timestamp: Timestamp | any;
  photoUrls: string[]; // URLs do Firebase Storage
  isPublic: boolean;
}

/**
 * Faz upload de uma foto para o Firebase Storage
 */
async function uploadPhoto(uri: string, wasteId: string, index: number): Promise<string> {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Busca a imagem
    const response = await fetch(uri);
    const blob = await response.blob();

    // Cria referência única para a foto
    const photoRef = ref(storage, `waste-photos/${user.uid}/${wasteId}/photo_${index}.jpg`);

    // Faz upload
    await uploadBytes(photoRef, blob);

    // Obtém URL de download
    const downloadURL = await getDownloadURL(photoRef);
    console.log(`✅ Foto ${index + 1} enviada:`, downloadURL);

    return downloadURL;
  } catch (error) {
    console.error(`❌ Erro ao enviar foto ${index}:`, error);
    throw error;
  }
}

/**
 * Deleta fotos do Firebase Storage
 */
async function deletePhotos(photoUrls: string[]): Promise<void> {
  try {
    const deletePromises = photoUrls.map(async (url) => {
      try {
        const photoRef = ref(storage, url);
        await deleteObject(photoRef);
        console.log('✅ Foto deletada:', url);
      } catch (error) {
        console.warn('⚠️ Erro ao deletar foto:', url, error);
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('❌ Erro ao deletar fotos:', error);
  }
}

/**
 * Salva registro de resíduo no Firebase
 */
export async function saveWasteToFirebase(
  wasteData: Omit<WasteLocation, 'id' | 'timestamp'>
): Promise<string> {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Cria ID único
    const wasteId = `${user.uid}_${Date.now()}`;

    // Faz upload das fotos
    const photoUrls: string[] = [];
    if (wasteData.photos && wasteData.photos.length > 0) {
      console.log(`📤 Enviando ${wasteData.photos.length} fotos...`);
      for (let i = 0; i < wasteData.photos.length; i++) {
        const url = await uploadPhoto(wasteData.photos[i], wasteId, i);
        photoUrls.push(url);
      }
    }

    // Prepara documento para o Firestore
    const firestoreData: FirebaseWasteLocation = {
      ...wasteData,
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'Usuário',
      photoUrls,
      isPublic: true, // Por padrão, todos os registros são públicos
      timestamp: serverTimestamp(),
    };

    // Salva no Firestore
    const docRef = doc(db, 'waste-locations', wasteId);
    await setDoc(docRef, firestoreData);

    console.log('✅ Registro salvo no Firebase:', wasteId);
    return wasteId;
  } catch (error) {
    console.error('❌ Erro ao salvar no Firebase:', error);
    throw error;
  }
}

/**
 * Busca registros do usuário atual
 */
export async function getUserWasteLocations(): Promise<WasteLocation[]> {
  try {
    const user = getCurrentUser();
    if (!user) return [];

    const q = query(
      collection(db, 'waste-locations'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const locations: WasteLocation[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as FirebaseWasteLocation;
      locations.push({
        id: doc.id,
        description: data.description,
        photos: data.photoUrls || [],
        location: data.location,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        noiseLevel: data.noiseLevel,
        lightLevel: data.lightLevel,
        accelerometer: data.accelerometer,
      });
    });

    console.log(`✅ ${locations.length} registros do usuário carregados`);
    return locations;
  } catch (error) {
    console.error('❌ Erro ao buscar registros do usuário:', error);
    return [];
  }
}

/**
 * Busca TODOS os registros públicos (de todos os usuários)
 */
export async function getAllPublicWasteLocations(): Promise<WasteLocation[]> {
  try {
    const q = query(
      collection(db, 'waste-locations'),
      where('isPublic', '==', true),
      orderBy('timestamp', 'desc'),
      limit(100) // Limita a 100 registros mais recentes
    );

    const snapshot = await getDocs(q);
    const locations: WasteLocation[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as FirebaseWasteLocation;
      locations.push({
        id: doc.id,
        description: data.description,
        photos: data.photoUrls || [],
        location: data.location,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        noiseLevel: data.noiseLevel,
        lightLevel: data.lightLevel,
        accelerometer: data.accelerometer,
      });
    });

    console.log(`✅ ${locations.length} registros públicos carregados`);
    return locations;
  } catch (error) {
    console.error('❌ Erro ao buscar registros públicos:', error);
    return [];
  }
}

/**
 * Busca um registro específico
 */
export async function getWasteLocation(id: string): Promise<WasteLocation | null> {
  try {
    const docRef = doc(db, 'waste-locations', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as FirebaseWasteLocation;
      return {
        id: docSnap.id,
        description: data.description,
        photos: data.photoUrls || [],
        location: data.location,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        noiseLevel: data.noiseLevel,
        lightLevel: data.lightLevel,
        accelerometer: data.accelerometer,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar registro:', error);
    return null;
  }
}

/**
 * Deleta registro do Firebase
 */
export async function deleteWasteFromFirebase(id: string): Promise<void> {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Busca o documento
    const docRef = doc(db, 'waste-locations', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Registro não encontrado');
    }

    const data = docSnap.data() as FirebaseWasteLocation;

    // Verifica se o usuário é o dono
    if (data.userId !== user.uid) {
      throw new Error('Você não tem permissão para deletar este registro');
    }

    // Deleta fotos do Storage
    if (data.photoUrls && data.photoUrls.length > 0) {
      await deletePhotos(data.photoUrls);
    }

    // Deleta documento do Firestore
    await deleteDoc(docRef);

    console.log('✅ Registro deletado do Firebase:', id);
  } catch (error) {
    console.error('❌ Erro ao deletar do Firebase:', error);
    throw error;
  }
}

/**
 * Observa mudanças em tempo real nos registros públicos
 */
export function subscribeToPublicWasteLocations(
  callback: (locations: WasteLocation[]) => void
): () => void {
  const q = query(
    collection(db, 'waste-locations'),
    where('isPublic', '==', true),
    orderBy('timestamp', 'desc'),
    limit(100)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const locations: WasteLocation[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as FirebaseWasteLocation;
        locations.push({
          id: doc.id,
          description: data.description,
          photos: data.photoUrls || [],
          location: data.location,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          noiseLevel: data.noiseLevel,
          lightLevel: data.lightLevel,
          accelerometer: data.accelerometer,
        });
      });

      console.log(`🔄 ${locations.length} registros atualizados em tempo real`);
      callback(locations);
    },
    (error) => {
      console.error('❌ Erro no listener de registros:', error);
    }
  );

  return unsubscribe;
}

/**
 * Obtém estatísticas gerais
 */
export async function getStatistics(): Promise<{
  totalRegistrations: number;
  userRegistrations: number;
}> {
  try {
    const user = getCurrentUser();
    
    // Total de registros públicos
    const publicQuery = query(
      collection(db, 'waste-locations'),
      where('isPublic', '==', true)
    );
    const publicSnapshot = await getDocs(publicQuery);
    const totalRegistrations = publicSnapshot.size;

    // Registros do usuário atual
    let userRegistrations = 0;
    if (user) {
      const userQuery = query(
        collection(db, 'waste-locations'),
        where('userId', '==', user.uid)
      );
      const userSnapshot = await getDocs(userQuery);
      userRegistrations = userSnapshot.size;
    }

    return {
      totalRegistrations,
      userRegistrations,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return {
      totalRegistrations: 0,
      userRegistrations: 0,
    };
  }
}
