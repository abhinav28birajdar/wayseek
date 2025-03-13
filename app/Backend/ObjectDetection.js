import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';

export default function ObjectDetection({ route }) {
  const { imageUri } = route.params;
  const [identifiedObject, setIdentifiedObject] = useState('Detecting...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModelAndDetect() {
      await tf.ready();
      const model = await mobilenet.load();
      const image = { uri: imageUri };
      const predictions = await model.classify(image);
      setIdentifiedObject(predictions[0]?.className || 'Unknown');
      setLoading(false);
    }
    loadModelAndDetect();
  }, [imageUri]);

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      <Text style={styles.label}>Detected Object:</Text>
      {loading ? <ActivityIndicator size="large" color="#0000ff" /> : <Text style={styles.objectText}>{identifiedObject}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  image: { width: 300, height: 300, resizeMode: 'contain', marginBottom: 20 },
  label: { fontSize: 20, fontWeight: 'bold' },
  objectText: { fontSize: 18, color: 'blue' },
});
