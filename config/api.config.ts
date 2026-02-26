import { Platform } from 'react-native';

const OVERRIDE_API_URL: string | null = 'http://192.168.0.6:3000/api';

const getApiUrl = () => {
  if (OVERRIDE_API_URL) {
    return OVERRIDE_API_URL;
  }

  if (!__DEV__) {
    return 'https://sua-api-producao.com/api';
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api';
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:3001/api';
  } else {
    return 'http://localhost:3001/api';
  }
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  
  TIMEOUT: 30000,
  
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

console.log('🌐 API URL configurada:', API_CONFIG.BASE_URL);
console.log('📱 Plataforma:', Platform.OS);
console.log('🔧 Modo Dev:', __DEV__);

export const API_ENDPOINTS = {

  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // Ocorrências
  OCCURRENCES: {
    BASE: '/occurrences',
    STATS: '/occurrences/stats',
    BOUNDS: '/occurrences/bounds',
    MY_OCCURRENCES: '/occurrences/my-occurrences',
    BY_ID: (id: string) => `/occurrences/${id}`,
  },
  
  PHOTOS: {
    UPLOAD: (occurrenceId: string) => `/photos/${occurrenceId}`,
    GET: (occurrenceId: string) => `/photos/${occurrenceId}`,
    DOWNLOAD: (photoId: string) => `/photos/download/${photoId}`,
    DELETE: (photoId: string) => `/photos/${photoId}`,
  },
  
  SHARES: {
    BASE: '/shares',
    SHARED_WITH_ME: '/shares/shared-with-me',
    SHARED_BY_ME: '/shares/shared-by-me',
    REVOKE: (shareId: string) => `/shares/${shareId}`,
  },
  
  HEALTH: '/health',
};
