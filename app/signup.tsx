import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpScreen() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite seu nome completo');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Erro', 'Digite um email válido');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signup(email.trim(), password, name.trim());
      Alert.alert(
        'Sucesso!',
        'Conta criada com sucesso! Bem-vindo ao CleanCity.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro ao criar conta', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6f9" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* INICIO */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="person-add" size={45} color="#fff" />
            </View>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Junte-se à comunidade CleanCity</Text>
          </View>

          {/* FROMS */}
          <View style={styles.formContainer}>
            
            {/* Nome */}
            <View style={styles.inputBox}>
              <MaterialIcons name="person" size={22} color="#747d8c" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome completo"
                placeholderTextColor="#a4b0be"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            {/* Email */}
            <View style={styles.inputBox}>
              <MaterialIcons name="email" size={22} color="#747d8c" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Seu melhor email"
                placeholderTextColor="#a4b0be"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Senha */}
            <View style={styles.inputBox}>
              <MaterialIcons name="lock" size={22} color="#747d8c" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha (mín. 6 caracteres)"
                placeholderTextColor="#a4b0be"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={22} color="#747d8c" />
              </TouchableOpacity>
            </View>

            {/* Confirmar Senha */}
            <View style={styles.inputBox}>
              <MaterialIcons name="lock-outline" size={22} color="#747d8c" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirme sua senha"
                placeholderTextColor="#a4b0be"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={22} color="#747d8c" />
              </TouchableOpacity>
            </View>

            {/* Cadastro */}
            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.signupButtonText}>Finalizar Cadastro</Text>
                  <MaterialIcons name="check-circle" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

          </View>

          {/* VOLTAR PARA LOGIN */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: Platform.OS === 'ios' ? 20 : 0,
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#00D084',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#00D084',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3c72',
  },
  subtitle: {
    fontSize: 14,
    color: '#747d8c',
    marginTop: 5,
  },

  formContainer: {
    width: '100%',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 55,
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2f3542',
  },
  eyeIcon: {
    padding: 10,
  },

  // Botão Principal
  signupButton: {
    flexDirection: 'row',
    backgroundColor: '#1e3c72',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    elevation: 4,
    shadowColor: '#1e3c72',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  signupButtonDisabled: {
    backgroundColor: '#a4b0be',
    elevation: 0,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 10,
  },

  // Rodapé
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,
  },
  footerText: {
    color: '#747d8c',
    fontSize: 15,
  },
  footerLink: {
    color: '#00D084',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});