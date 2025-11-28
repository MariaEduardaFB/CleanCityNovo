 import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  PanResponder,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import {
  initializeNotifications,
  showNotification,
} from '@/utils/notifications';
import { saveWasteLocation } from '@/utils/storage';
import { styles } from './styles/index.styles';

interface LocationData {
  latitude: number;
  longitude: number;
}

export default function HomeScreen() {
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [customLatitude, setCustomLatitude] = useState('');
  const [customLongitude, setCustomLongitude] = useState('');

  const initialPanelHeight = Math.max(Dimensions.get('window').height * 0.4, 300);
  const expandedPanelHeight = Dimensions.get('window').height - 120;
  const minPanelHeight = 80; 
  const animatedHeight = useRef(new Animated.Value(initialPanelHeight)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  
  const startHeightRef = useRef<number>(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_evt, _gs) => true,
      onMoveShouldSetPanResponder: (_evt, gs) => Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        
        animatedHeight.stopAnimation((value: number) => {
          startHeightRef.current = value;
        });
      },
      onPanResponderMove: (_evt, gs) => {
       
        const newHeight = Math.min(
          Math.max(startHeightRef.current - gs.dy, minPanelHeight),
          expandedPanelHeight
        );
        animatedHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_evt, gs) => {
        
        const moved = Math.abs(gs.dy) > 6 || Math.abs(gs.dx) > 6;
        if (!moved) {
          
          togglePanel();
          return;
        }

        
        const finalHeight = Math.min(
          Math.max(startHeightRef.current - gs.dy, minPanelHeight),
          expandedPanelHeight
        );
        const snapTargets = [minPanelHeight, initialPanelHeight, expandedPanelHeight];
        let nearest = snapTargets[0];
        let minDiff = Math.abs(finalHeight - snapTargets[0]);
        for (let i = 1; i < snapTargets.length; i++) {
          const d = Math.abs(finalHeight - snapTargets[i]);
          if (d < minDiff) {
            minDiff = d;
            nearest = snapTargets[i];
          }
        }
        Animated.timing(animatedHeight, {
          toValue: nearest,
          duration: 180,
          useNativeDriver: false,
        }).start(() => {
          setIsExpanded(nearest === expandedPanelHeight);
          
          if (nearest === minPanelHeight) autoExpandedRef.current = false;
        });
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

  
  const autoExpandedRef = useRef(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  useEffect(() => {
    const onShow = () => {
    
      if (!isExpanded) {
        autoExpandedRef.current = true;
        Animated.timing(animatedHeight, {
          toValue: expandedPanelHeight,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setIsExpanded(true);
          
          setTimeout(() => {
            try {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            } catch (err) {
             
            }
          }, 220);
        });
      }
    };

    const onHide = () => {
      if (autoExpandedRef.current) {
        Animated.timing(animatedHeight, {
          toValue: initialPanelHeight,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setIsExpanded(false);
          autoExpandedRef.current = false;
        });
      }
    };

    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';
    const s1 = Keyboard.addListener(showEvent, onShow);
    const s2 = Keyboard.addListener(hideEvent, onHide);
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [animatedHeight, expandedPanelHeight, initialPanelHeight, isExpanded]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão negada',
          'Precisamos da permissão de localização para continuar.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setCustomLatitude(location.coords.latitude.toString());
      setCustomLongitude(location.coords.longitude.toString());
    })();
  }, []);

  useEffect(() => {
   
    (async () => {
      try {
        const granted = await initializeNotifications();
        console.log('Notificações habilitadas:', granted);
      } catch (err) {
        console.error('Erro inicializando notificações:', err);
      }
    })();
  }, []);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      alert('Desculpe, precisamos de permissão para acessar a câmera!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (!location && !isEditingLocation) {
      Alert.alert('Erro', 'Não foi possível obter a localização');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, adicione uma descrição');
      return;
    }

    const finalLocation = isEditingLocation
      ? {
          latitude: parseFloat(customLatitude),
          longitude: parseFloat(customLongitude),
        }
      : location;

    try {
      
      await saveWasteLocation({
        description: description.trim(),
        photos,
        location: finalLocation!,
      });

      
      try {
        await showNotification(
          'Registro enviado',
          'Seu registro foi enviado com sucesso.'
        );
      } catch (notifyError) {
        console.error('Erro ao disparar notificação:', notifyError);
      }

      Alert.alert('Sucesso', 'Local registrado com sucesso!');

     
      setDescription('');
      setPhotos([]);
      setIsEditingLocation(false);
      setCustomLatitude('');
      setCustomLongitude('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o local. Tente novamente.');
      console.error('Erro ao salvar:', error);
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <MaterialIcons name="eco" size={32} color="#ffffff" />
            <View style={styles.brandText}>
              <ThemedText style={styles.appTitle}>Clean City</ThemedText>
              <ThemedText style={styles.appSubtitle}>
                Registro de Ocorrências
              </ThemedText>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <MaterialIcons name="online-prediction" size={16} color="#4CAF50" />
            <ThemedText style={styles.statusText}>Online</ThemedText>
          </View>
        </View>
      </View>

     
      {location && (
        <MapView
          style={styles.backgroundMap}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(event) => {
            const { latitude, longitude } = event.nativeEvent.coordinate;
            setCustomLatitude(latitude.toString());
            setCustomLongitude(longitude.toString());
            setIsEditingLocation(true);
          }}
        >
          <Marker
            coordinate={{
              latitude: isEditingLocation
                ? parseFloat(customLatitude) || location.latitude
                : location.latitude,
              longitude: isEditingLocation
                ? parseFloat(customLongitude) || location.longitude
                : location.longitude,
            }}
            title="Local Selecionado"
            description={
              isEditingLocation
                ? 'Localização personalizada'
                : 'Sua localização atual'
            }
            draggable={true}
            onDragEnd={(event) => {
              const { latitude, longitude } = event.nativeEvent.coordinate;
              setCustomLatitude(latitude.toString());
              setCustomLongitude(longitude.toString());
              setIsEditingLocation(true);
            }}
          />
        </MapView>
      )}

      
      <Animated.View style={[styles.bottomPanel, { height: animatedHeight }]}>
        
        <View
          {...panResponder.panHandlers}
          style={styles.dragHandleArea}
          collapsable={false}
        >
          <TouchableOpacity
            onPress={togglePanel}
            activeOpacity={0.8}
            style={styles.panelHandleContainer}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.panelHandle} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={(r) => { scrollViewRef.current = r; }}
          style={styles.formScrollView}
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.locationCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="location-on" size={24} color="#2196F3" />
              <ThemedText style={styles.cardTitle}>Localização</ThemedText>
            </View>
            <ThemedText style={styles.locationInstructions}>
              {isEditingLocation
                ? 'Localização personalizada selecionada'
                : 'Toque no mapa para ajustar a posição'}
            </ThemedText>
            {isEditingLocation && (
              <View style={styles.coordsContainer}>
                <ThemedText style={styles.coordsText}>
                  {parseFloat(customLatitude).toFixed(6)},{' '}
                  {parseFloat(customLongitude).toFixed(6)}
                </ThemedText>
              </View>
            )}
          </View>

          
          <View style={styles.descriptionCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="description" size={24} color="#FF9800" />
              <ThemedText style={styles.cardTitle}>
                Descrição da Ocorrência
              </ThemedText>
            </View>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva detalhadamente o problema encontrado..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

        
          <View style={styles.photoCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="photo-camera" size={24} color="#9C27B0" />
              <ThemedText style={styles.cardTitle}>
                Evidências Fotográficas
              </ThemedText>
            </View>

            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <MaterialIcons size={24} color="#9C27B0" name="add-a-photo" />
              <ThemedText style={styles.photoButtonText}>
                Adicionar Fotos
              </ThemedText>
            </TouchableOpacity>

            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                <ThemedText style={styles.photoCount}>
                  {photos.length} foto{photos.length > 1 ? 's' : ''} anexada
                  {photos.length > 1 ? 's' : ''}
                </ThemedText>
                <ScrollView
                  horizontal
                  style={styles.photoContainer}
                  showsHorizontalScrollIndicator={false}
                >
                  {photos.map((photo, index) => (
                    <View key={index} style={styles.photoWrapper}>
                      <Image source={{ uri: photo }} style={styles.photo} />
                      <View style={styles.photoIndex}>
                        <ThemedText style={styles.photoIndexText}>
                          {index + 1}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        
        <View style={styles.submitContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <MaterialIcons size={24} color="#fff" name="send" />
            <ThemedText style={styles.submitButtonText}>
              Enviar Registro
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

