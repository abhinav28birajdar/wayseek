import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function BookScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Book Screen Content</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  text: {
    fontSize: 18,
  },
});
