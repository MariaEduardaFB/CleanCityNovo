import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const modelJson = require('../assets/model/model.json');
const modelWeights = require('../assets/model/weights.mp4');
const metadataJson = require('../assets/model/metadata.json');

export function useTrashClassifier() {
  const [isReady, setIsReady] = useState(false);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    async function loadModel() {
      try {
        console.log('Iniciando o motor da IA...');

        await tf.ready();
        
        console.log('Carregando o cérebro...');

        const loadedModel = await tf.loadLayersModel(
          bundleResourceIO(modelJson, modelWeights)
        );
        setModel(loadedModel);

        if (metadataJson && metadataJson.labels) {
          setLabels(metadataJson.labels);
        }

        console.log('✅ IA 100% pronta e carregada!');
        setIsReady(true);
      } catch (error) {
        console.error('❌ Erro ao carregar a IA:', error);
      }
    }

    loadModel();
  }, []);

  return { isReady, model, labels };
}