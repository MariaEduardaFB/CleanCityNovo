import * as ImageManipulator from "expo-image-manipulator";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, StatusBar, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { bundleResourceIO } from "@tensorflow/tfjs-react-native";
import { MaterialIcons } from '@expo/vector-icons';

export default function ClassifyScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    async function loadModel() {
      await tf.ready();
      const modelJson = require("../../assets/model/model.json");
      const modelWeights = require("../../assets/model/weights.mp4");
      const metadataJson = require("../../assets/model/metadata.json");

      const loadedModel = await tf.loadLayersModel(
        bundleResourceIO(modelJson, modelWeights)
      );
      setModel(loadedModel);
    }
    loadModel();
  }, []);

  const pickImageFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      classifyImage(uri);
    }
  };

  const takePictureAndClassify = async () => {
    if (!cameraRef.current) return;
    
    const photo = await cameraRef.current.takePictureAsync({
      skipProcessing: true,
    });
    
    setSelectedImage(photo.uri);
    classifyImage(photo.uri);
  };

  const classifyImage = async (imageUri: string) => {
    if (!model) return;

    try {
      setPrediction("Analisando...");

      const resized = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 224, height: 224 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!resized.base64) return;

      const raw = tf.util.encodeString(resized.base64, "base64");
      const imageTensor = decodeJpeg(raw);

      const normalized = imageTensor.toFloat().div(255.0);
      const expanded = normalized.expandDims(0);

      const predictions = model.predict(expanded) as tf.Tensor;
      const data = await predictions.data();

      const classes = ['Orgânico 🍎', 'Não Reciclável 🗑️', 'Reciclável ♻️']; 
      const maxIndex = data.indexOf(Math.max(...data));
      
      setPrediction(`${classes[maxIndex]}\nCerteza: ${(data[maxIndex] * 100).toFixed(1)}%`);

      tf.dispose([imageTensor, normalized, expanded, predictions]);

    } catch (error) {
      console.error("Erro na classificação:", error);
      setPrediction("Erro ao analisar foto.");
    }
  };

  const resetCamera = () => {
    setSelectedImage(null);
    setPrediction(null);
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color="#1e3c72" /></View>;
  
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="camera-alt" size={60} color="#1e3c72" style={{ marginBottom: 20 }} />
        <Text style={styles.permissionText}>Precisamos da permissão da câmera para analisar o lixo.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Permitir Câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* CÂMERA OU FOTO) */}
      {selectedImage ? (
        <Image source={{ uri: selectedImage }} style={styles.camera} />
      ) : (
        <CameraView style={styles.camera} ref={cameraRef} facing="back" />
      )}
      
      {/* CABEÇALHO FLUTUANTEEE */}
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Classificador de Resíduos</Text>
        <Text style={styles.headerSubtitle}>
          {model ? "IA pronta para analisar" : "Carregando modelo..."}
        </Text>
      </View>

      {/* PAINEL  */}
      <View style={styles.bottomPanel}>
        
        {/* Resultado da IA */}
        {prediction && (
          <View style={styles.resultCard}>
            {prediction === "Analisando..." ? (
              <ActivityIndicator size="small" color="#1e3c72" style={{ marginRight: 10 }} />
            ) : (
              <MaterialIcons name="check-circle" size={24} color="#00D084" style={{ marginRight: 10 }} />
            )}
            <Text style={styles.resultText}>{prediction}</Text>
          </View>
        )}

        {/* Botões */}
        <View style={styles.buttonContainer}>
          {!selectedImage ? (
            <>
              <TouchableOpacity style={styles.cameraButton} onPress={takePictureAndClassify}>
                <MaterialIcons name="camera" size={24} color="#fff" />
                <Text style={styles.buttonText}>Capturar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
                <MaterialIcons name="photo-library" size={24} color="#fff" />
                <Text style={styles.buttonText}>Galeria</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.resetButton} onPress={resetCamera}>
              <MaterialIcons name="refresh" size={24} color="#1e3c72" />
              <Text style={styles.resetButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  camera: { 
    flex: 1, 
    width: '100%' 
  },
  
  // Telas de carregamento e permissão
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 30,
    backgroundColor: '#f4f6f9'
  },
  permissionText: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#333' },
  permissionButton: { backgroundColor: '#1e3c72', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 25 },
  permissionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 10,
    borderRadius: 20,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#ddd', fontSize: 12, marginTop: 2 },

  bottomPanel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    paddingTop: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  resultCard: {
    flexDirection: 'row',
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: 'center',
  },
  resultText: {
    color: "#1e3c72",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: 'center',
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  cameraButton: { 
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#00D084',
    paddingVertical: 16,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  galleryButton: { 
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  resetButton: { 
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButtonText: {
    color: '#1e3c72',
    fontSize: 16,
    fontWeight: 'bold',
  }
});