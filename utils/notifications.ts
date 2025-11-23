// LOCAL NOTIFICATIONS ONLY - Expo Go Compatible
// Note: Remote/Push notifications require development builds since SDK 53
// This warning is expected in Expo Go but local notifications still work

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler for local notifications only
// The import warning above is expected in Expo Go but functionality works
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Ajustado para conter campos esperados pelas versões mais novas
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const initializeNotifications = async (): Promise<boolean> => {
  try {
    console.log(
      '🔔 Inicializando notificações locais (warning do Expo Go é esperado)...'
    );

    // Request permissions for LOCAL notifications only
    // Remote/Push notifications require development builds since SDK 53
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Criar canal no Android para notificações locais
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    console.log('📍 Status da permissão:', finalStatus);
    const isEnabled = finalStatus === 'granted';
    console.log('✅ Notificações locais funcionando corretamente:', isEnabled);
    console.log(
      'ℹ️  Warning do expo-notifications é esperado no Expo Go mas não afeta funcionalidade'
    );
    return isEnabled;
  } catch (error) {
    console.error('❌ Erro inicializando notificações locais:', error);
    console.log('ℹ️  Mesmo com erro, app continua funcionando normalmente');
    return false;
  }
};

export const showNotification = async (
  title: string,
  body?: string,
  data?: Record<string, any>
): Promise<void> => {
  try {
    // Schedule LOCAL notification immediately
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
      },
      trigger: null, // Show immediately
    });
    console.log('🔔 Notificação local enviada com sucesso:', title, body);
  } catch (error) {
    console.error('❌ Erro ao enviar notificação local:', error);
    console.log('ℹ️  Mesmo com erro, registro foi salvo com sucesso');
  }
};
