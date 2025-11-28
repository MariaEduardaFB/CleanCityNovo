import AsyncStorage from '@react-native-async-storage/async-storage';
type AccelerometerData = {
  x: number;
  y: number;
  z: number;
};

export interface WasteLocation {
  id: string;
  description: string;
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  // Dados dos sensores
  noiseLevel?: number | null;
  lightLevel?: number | null;
  accelerometer?: AccelerometerData | null;
}

const WASTE_LOCATIONS_KEY = 'waste_locations';

export const saveWasteLocation = async (
  wasteLocation: Omit<WasteLocation, 'id' | 'timestamp'>
): Promise<void> => {
  try {
    console.log('💾 Iniciando salvamento de localização...');
    // Buscar locais existentes
    const existingData = await getWasteLocations();
    console.log('📋 Dados existentes:', existingData.length, 'locais');

    // Criar novo local com ID único e timestamp
    const newLocation: WasteLocation = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...wasteLocation,
    };

    console.log('✨ Novo local criado:', newLocation);

    // Adicionar novo local à lista
    const updatedData = [...existingData, newLocation];
    console.log('📊 Total após adição:', updatedData.length, 'locais');

    // Salvar no AsyncStorage
    await AsyncStorage.setItem(
      WASTE_LOCATIONS_KEY,
      JSON.stringify(updatedData)
    );
    console.log('✅ Localização salva com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao salvar localização:', error);
    throw error;
  }
};

export const getWasteLocations = async (): Promise<WasteLocation[]> => {
  try {
    console.log('🔍 Buscando localizações no AsyncStorage...');
    const data = await AsyncStorage.getItem(WASTE_LOCATIONS_KEY);
    console.log('📱 Dados brutos do AsyncStorage:', data);
    const result = data ? JSON.parse(data) : [];
    console.log('📋 Localizações parseadas:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro ao buscar localizações:', error);
    return [];
  }
};

export const deleteWasteLocation = async (id: string): Promise<void> => {
  try {
    const existingData = await getWasteLocations();
    const updatedData = existingData.filter((location) => location.id !== id);
    await AsyncStorage.setItem(
      WASTE_LOCATIONS_KEY,
      JSON.stringify(updatedData)
    );
  } catch (error) {
    console.error('Erro ao deletar localização:', error);
    throw error;
  }
};

export const clearAllWasteLocations = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(WASTE_LOCATIONS_KEY);
  } catch (error) {
    console.error('Erro ao limpar localizações:', error);
    throw error;
  }
};
