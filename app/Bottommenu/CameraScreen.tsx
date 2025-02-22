import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showText, setShowText] = useState(true);
  const slideAnim = useState(new Animated.Value(1))[0];

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  function toggleTextSection() {
    Animated.timing(slideAnim, {
      toValue: showText ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowText(!showText));
  }

  return (
    <View style={styles.container}>
      {/* Top Half - Camera */}
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} />
      </View>

      {/* Bottom Half - Text Content */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }],
            opacity: slideAnim,
          },
        ]}
      >
        <Text style={styles.text}>Camera Controls & Info</Text>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.buttonText}>Flip Camera</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Toggle Button (Behind Flip Camera) */}
      <TouchableOpacity style={styles.toggleButton} onPress={toggleTextSection}>
        <Text style={styles.buttonText}>{showText ? 'Hide' : 'Show'} Text</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  toggleButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 5,
  },
});
