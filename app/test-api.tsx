import { useEffect } from 'react';
import { View, Button, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';

/**
 * Tela de teste de conexão com a API
 * Use isso para debugar problemas de rede
 */
export default function TestApiScreen() {
  useEffect(() => {
    console.log('🧪 Tela de teste carregada');
  }, []);

  const testConnection = async () => {
    console.log('🧪 Iniciando teste de conexão...');
    
    try {
      const url = 'http://localhost:3001/health';
      console.log('🌐 Testando URL:', url);
      
      const response = await fetch(url);
      console.log('📥 Status:', response.status);
      
      const data = await response.json();
      console.log('📄 Dados:', data);
      
      Alert.alert('Sucesso!', `API respondeu: ${JSON.stringify(data)}`);
    } catch (error: any) {
      console.error('❌ Erro:', error);
      Alert.alert('Erro', error.message);
    }
  };

  const testSignup = async () => {
    console.log('🧪 Testando signup...');
    
    try {
      const url = 'http://localhost:3001/api/auth/signup';
      console.log('🌐 Testando URL:', url);
      
      const body = {
        email: 'teste' + Date.now() + '@teste.com',
        password: '123456',
        fullName: 'Teste Usuario'
      };
      
      console.log('📦 Body:', body);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      console.log('📥 Status:', response.status);
      
      const data = await response.json();
      console.log('📄 Dados:', data);
      
      Alert.alert('Sucesso!', `Signup respondeu: ${response.status}`);
    } catch (error: any) {
      console.error('❌ Erro:', error);
      Alert.alert('Erro', error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <ThemedText style={{ fontSize: 24, marginBottom: 20 }}>
        🧪 Teste de API
      </ThemedText>
      
      <Button title="Testar Health" onPress={testConnection} />
      
      <View style={{ height: 20 }} />
      
      <Button title="Testar Signup" onPress={testSignup} />
      
      <View style={{ height: 20 }} />
      
      <ThemedText style={{ textAlign: 'center', color: '#666' }}>
        Verifique o console do Metro bundler para ver os logs
      </ThemedText>
    </View>
  );
}
