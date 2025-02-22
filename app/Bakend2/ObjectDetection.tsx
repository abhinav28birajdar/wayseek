import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface ObjectDetectionProps {
  detectedObjects: string[];
}

export const ObjectDetection: React.FC<ObjectDetectionProps> = ({ detectedObjects }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detected Objects</Text>
      <ScrollView style={styles.scrollView}>
        {detectedObjects.map((object, index) => (
          <Text key={index} style={styles.objectText}>
            • {object}
          </Text>
        ))}
        {detectedObjects.length === 0 && (
          <Text style={styles.noObjectsText}>
            Tap 'Detect Objects' to analyze the current view
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  objectText: {
    fontSize: 16,
    marginBottom: 8,
  },
  noObjectsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});