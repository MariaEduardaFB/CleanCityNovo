import { View, Text, Button, StyleSheet } from 'react-native';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { useTrashClassifier } from '../hooks/useTrashClassifier';

export default function TestIAScreen() {
  // Permissão da câmera
  const [permission, requestPermission] = useCameraPermissions();
  
  const { isReady, model, labels } = useTrashClassifier();

  if (!permission) return <View />;
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Precisamos da câmera para analisar o lixo!</Text>
        <Button title="Dar permissão" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* IA carregou */}
      {isReady ? (
        <Text style={styles.textReady}>✅ IA Pronta para analisar!</Text>
      ) : (
        <Text style={styles.textLoading}>⏳ Carregando inteligência...</Text>
      )}

      {/* Câmera */}
      <CameraView style={styles.camera} facing="back" />

      {/* FT */}
      <View style={styles.buttonContainer}>
        <Button title="Tirar Foto do Lixo" onPress={() => console.log('Em breve: Analisar foto!')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 0.8 },
  textReady: { textAlign: 'center', fontSize: 18, margin: 20, color: '#4ade80', fontWeight: 'bold' },
  textLoading: { textAlign: 'center', fontSize: 18, margin: 20, color: '#facc15', fontWeight: 'bold' },
  text: { textAlign: 'center', fontSize: 16, margin: 20, color: '#fff' },
  buttonContainer: { flex: 0.2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }
});