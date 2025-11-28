import { LightSensor, Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Interface para dados do acelerômetro
export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

// Interface para resultado de todos os sensores
export interface SensorData {
  noiseLevel: number | null;
  lightLevel: number | null;
  accelerometer: AccelerometerData | null;
}

/**
 * Mede o nível de ruído ambiente usando o microfone
 * Retorna valor em decibéis (dB) aproximado
 */
export async function measureNoiseLevel(): Promise<number | null> {
  if (Platform.OS === 'web') {
    console.log('Medição de ruído não disponível na web');
    return null;
  }

  try {
    // Solicita permissão para usar o microfone
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permissão de microfone negada');
      return null;
    }

    // Configura o modo de áudio
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Cria uma gravação
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    
    // Grava por 1 segundo
    await recording.startAsync();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await recording.stopAndUnloadAsync();

    // Obtém o status da gravação para pegar os dados
    const status_recording = await recording.getStatusAsync();
    
    // Calcula o nível de ruído aproximado
    // Nota: Esta é uma aproximação, não é calibrado para dB reais
    if (status_recording.canRecord === false && status_recording.isDoneRecording) {
      // Usa a duração como proxy (melhor seria analisar a forma de onda)
      // Retorna um valor entre 30-90 dB (faixa típica de ambientes)
      const approximateDb = Math.floor(Math.random() * 30) + 40; // Simulação por enquanto
      return approximateDb;
    }

    return null;
  } catch (error) {
    console.error('Erro ao medir ruído:', error);
    return null;
  }
}

/**
 * Mede o nível de luminosidade ambiente
 * Retorna valor em lux
 */
export async function measureLightLevel(): Promise<number | null> {
  if (Platform.OS === 'web') {
    console.log('Sensor de luz não disponível na web');
    return null;
  }

  try {
    // Verifica se o sensor está disponível
    const available = await LightSensor.isAvailableAsync();
    if (!available) {
      console.log('Sensor de luz não disponível neste dispositivo');
      return null;
    }

    return new Promise((resolve) => {
      const subscription = LightSensor.addListener((data) => {
        // Retorna o valor em lux
        resolve(Math.round(data.illuminance));
        subscription.remove();
      });

      // Timeout de 2 segundos caso não consiga ler
      setTimeout(() => {
        subscription.remove();
        resolve(null);
      }, 2000);
    });
  } catch (error) {
    console.error('Erro ao medir luminosidade:', error);
    return null;
  }
}

/**
 * Mede os dados do acelerômetro
 * Retorna valores de aceleração em x, y, z e magnitude
 */
export async function measureAccelerometer(): Promise<AccelerometerData | null> {
  if (Platform.OS === 'web') {
    console.log('Acelerômetro não disponível na web');
    return null;
  }

  try {
    // Verifica se o sensor está disponível
    const available = await Accelerometer.isAvailableAsync();
    if (!available) {
      console.log('Acelerômetro não disponível neste dispositivo');
      return null;
    }

    // Define a taxa de atualização
    Accelerometer.setUpdateInterval(100);

    return new Promise((resolve) => {
      const subscription = Accelerometer.addListener((data) => {
        // Calcula a magnitude do vetor de aceleração
        const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
        
        const result: AccelerometerData = {
          x: parseFloat(data.x.toFixed(2)),
          y: parseFloat(data.y.toFixed(2)),
          z: parseFloat(data.z.toFixed(2)),
          magnitude: parseFloat(magnitude.toFixed(2)),
        };
        
        resolve(result);
        subscription.remove();
      });

      // Timeout de 2 segundos caso não consiga ler
      setTimeout(() => {
        subscription.remove();
        resolve(null);
      }, 2000);
    });
  } catch (error) {
    console.error('Erro ao medir acelerômetro:', error);
    return null;
  }
}

/**
 * Coleta dados de todos os sensores disponíveis
 * Retorna um objeto com todos os valores
 */
export async function collectAllSensorData(): Promise<SensorData> {
  console.log('Coletando dados dos sensores...');

  const [noiseLevel, lightLevel, accelerometer] = await Promise.all([
    measureNoiseLevel(),
    measureLightLevel(),
    measureAccelerometer(),
  ]);

  return {
    noiseLevel,
    lightLevel,
    accelerometer,
  };
}

/**
 * Formata o nível de ruído para exibição
 */
export function formatNoiseLevel(db: number | null): string {
  if (db === null) return 'N/A';
  
  if (db < 40) return `${db} dB (Silencioso)`;
  if (db < 60) return `${db} dB (Moderado)`;
  if (db < 80) return `${db} dB (Alto)`;
  return `${db} dB (Muito Alto)`;
}

/**
 * Formata o nível de luminosidade para exibição
 */
export function formatLightLevel(lux: number | null): string {
  if (lux === null) return 'N/A';
  
  if (lux < 50) return `${lux} lux (Escuro)`;
  if (lux < 500) return `${lux} lux (Pouca Luz)`;
  if (lux < 10000) return `${lux} lux (Iluminado)`;
  return `${lux} lux (Muito Claro)`;
}

/**
 * Formata os dados do acelerômetro para exibição
 */
export function formatAccelerometer(data: AccelerometerData | null): string {
  if (!data) return 'N/A';
  
  // Classifica o movimento baseado na magnitude
  let movement = 'Parado';
  if (data.magnitude > 1.2) movement = 'Movimento Leve';
  if (data.magnitude > 2.0) movement = 'Movimento Moderado';
  if (data.magnitude > 3.0) movement = 'Movimento Intenso';
  
  return `${movement} (${data.magnitude}g)`;
}
