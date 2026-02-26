import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  PanResponder,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  useWindowDimensions,
  Image
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { useOccurrences } from '@/hooks/useOccurrences';
import { styles } from '../styles/index.styles'; 

interface LocationData {
  latitude: number;
  longitude: number;
}

export default function HomeScreen() {
  const { createOccurrence } = useOccurrences();
  const { height: windowHeight } = useWindowDimensions();
  
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [customLatitude, setCustomLatitude] = useState('');
  const [customLongitude, setCustomLongitude] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);
  const startHeightRef = useRef<number>(0);

  const initialPanelHeight = Math.max(windowHeight * 0.4, 300);
  const expandedPanelHeight = windowHeight * 0.8; 
  const minPanelHeight = 80; 
  
  const animatedHeight = useRef(new Animated.Value(initialPanelHeight)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
      onPanResponderGrant: () => {
        animatedHeight.stopAnimation((value) => {
          startHeightRef.current = typeof value === 'number' ? value : (value as any).value || initialPanelHeight;
        });
      },
      onPanResponderMove: (_, gs) => {
        const newHeight = Math.min(
          Math.max(startHeightRef.current - gs.dy, minPanelHeight),
          expandedPanelHeight
        );
        animatedHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gs) => {
        const finalHeight = startHeightRef.current - gs.dy;
        let target = initialPanelHeight;
        
        if (finalHeight > initialPanelHeight + 50) target = expandedPanelHeight;
        else if (finalHeight < initialPanelHeight - 50) target = minPanelHeight;

        Animated.spring(animatedHeight, {
          toValue: target,
          useNativeDriver: false,
          tension: 40,
          friction: 8
        }).start(() => setIsExpanded(target === expandedPanelHeight));
      },
    })
  ).current;

  const togglePanel = () => {
    const toValue = isExpanded ? initialPanelHeight : expandedPanelHeight;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setIsExpanded(!isExpanded));
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        setCustomLatitude(loc.coords.latitude.toString());
        setCustomLongitude(loc.coords.longitude.toString());
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Erro', 'Aguardando localização GPS...');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Atenção', 'Por favor, descreva o problema observado.');
      return;
    }

    try {
      const finalLat = isEditingLocation ? parseFloat(customLatitude) : location.latitude;
      const finalLng = isEditingLocation ? parseFloat(customLongitude) : location.longitude;

      const occurrenceData = {
        title: "Registro de Resíduo",
        description: description.trim(),
        latitude: finalLat,
        longitude: finalLng,
        photos: photos,
        accelerometerX: 0,
        accelerometerY: 0,
        accelerometerZ: 0,
      };

      const result = await createOccurrence(occurrenceData);
      const isSuccess = result && (result.success || result.id || (result.data && result.data.id));

      if (isSuccess) {
        Alert.alert('Sucesso', 'Ocorrência registrada com sucesso!');
        setDescription('');
        setPhotos([]);
        if (isExpanded) togglePanel();
        Keyboard.dismiss();
      } else {
        const errorMsg = result?.error?.message || result?.error || 'Erro desconhecido ao salvar';
        Alert.alert('Aviso', `O servidor respondeu: ${errorMsg}`);
      }
    } catch (error: any) {
      Alert.alert('Erro de Conexão', 'Não foi possível contatar o servidor.');
    }
  };

  const takePhoto = async () => {
    // 🔹 TRAVA DE LIMITE: Máximo de 3 fotos
    if (photos.length >= 3) {
      Alert.alert('Limite Atingido', 'Você pode adicionar no máximo 3 fotos por registro.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erro', 'Permissão de câmera negada.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.2, 
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhotos([...photos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  // Remove a foto
  const removePhoto = (indexToRemove: number) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={[styles.header, { zIndex: 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <MaterialIcons name="eco" size={32} color="#ffffff" />
            <View style={styles.brandText}>
              <ThemedText style={styles.appTitle}>Clean City</ThemedText>
              <ThemedText style={styles.appSubtitle}>Registro de Ocorrências</ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.backgroundMap}>
        {location && (
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: isEditingLocation ? parseFloat(customLatitude) : location.latitude,
                longitude: isEditingLocation ? parseFloat(customLongitude) : location.longitude,
              }}
            />
          </MapView>
        )}
      </View>

      <Animated.View style={[styles.bottomPanel, { 
        height: animatedHeight, 
        position: 'absolute', 
        bottom: 0, 
        width: '100%', 
        zIndex: 20 
      }]}>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          style={{ flex: 1 }}
        >
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <TouchableOpacity onPress={togglePanel} style={styles.panelHandleContainer}>
              <View style={styles.panelHandle} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={[styles.formContainer, { paddingBottom: 60 }]}
            keyboardShouldPersistTaps="always"
          >
            <View style={styles.locationCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="location-on" size={24} color="#2196F3" />
                <ThemedText style={styles.cardTitle}>Localização Atual</ThemedText>
              </View>
              <ThemedText style={{ color: '#666', fontSize: 13 }}>
                {location ? `Lat: ${location.latitude.toFixed(6)}, Lon: ${location.longitude.toFixed(6)}` : 'Buscando GPS...'}
              </ThemedText>
            </View>

            <View style={[styles.descriptionCard, { minHeight: 160 }]}>
              <ThemedText style={styles.cardTitle}>Descrição do Problema</ThemedText>
              <TextInput
                style={[styles.descriptionInput, { height: 100, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descreva o que você está vendo..."
                multiline={true}
                blurOnSubmit={true}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {/* BOTÃO DE LIMITE DE 3 */}
                <TouchableOpacity 
                  style={[styles.photoButton, { flex: 1, opacity: photos.length >= 3 ? 0.5 : 1 }]} 
                  onPress={takePhoto}
                >
                    <MaterialIcons name="add-a-photo" size={20} color="#9C27B0" />
                    <ThemedText style={{fontSize: 12, marginLeft: 5}}>Foto ({photos.length}/3)</ThemedText>
                </TouchableOpacity>
                <View style={[styles.photoButton, { flex: 1, backgroundColor: '#F5F5F5' }]}>
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    <ThemedText style={{fontSize: 12, marginLeft: 5}}>GPS Ativo</ThemedText>
                </View>
            </View>

            {/* MINIATURAS (Só aparece se tiver a foto) */}
            {photos.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ marginTop: 15 }}
                contentContainerStyle={{ paddingTop: 10, paddingRight: 10 }} 
              >
                {photos.map((photo, index) => (
                  <View key={index} style={{ marginRight: 15, position: 'relative' }}>
                    <Image 
                      source={{ uri: photo }} 
                      style={{ 
                        width: 75, 
                        height: 75, 
                        borderRadius: 12, 
                        borderWidth: 1, 
                        borderColor: '#ddd' 
                      }} 
                    />
                    <TouchableOpacity 
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        elevation: 4, 
                        shadowColor: '#000', 
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 2,
                      }}
                      onPress={() => removePhoto(index)}
                    >
                      <MaterialIcons name="cancel" size={24} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity 
              style={[styles.submitButton, { marginTop: 20, backgroundColor: '#4CAF50' }]} 
              onPress={handleSubmit}
            >
              <ThemedText style={styles.submitButtonText}>ENVIAR REGISTRO</ThemedText>
              <MaterialIcons name="send" size={20} color="#fff" style={{marginLeft: 10}} />
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}