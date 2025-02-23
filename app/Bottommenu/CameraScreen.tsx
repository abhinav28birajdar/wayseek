import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function App(): JSX.Element {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showSecondView, setShowSecondView] = useState<boolean>(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={requestPermission}
        >
          <Text style={styles.startButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing(): void {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  if (!showSecondView) {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => setShowSecondView(true)}
            >
              <Text style={styles.startButtonText}>START</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.flipButton} 
              onPress={toggleCameraFacing}
            >
              <MaterialIcons name="flip-camera-ios" size={30} color="#2C1810" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.whiteSection}>
        <CameraView style={styles.camera} facing={facing}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowSecondView(false)}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </CameraView>
        <View style={styles.secondViewButtonContainer}>
          <TouchableOpacity 
            style={styles.flipButton} 
            onPress={toggleCameraFacing}
          >
            <MaterialIcons name="flip-camera-ios" size={30} color="#2C1810" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.brownSection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    backgroundColor: '#fff',
    width: width,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    width: '100%',
    paddingHorizontal: 0,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  secondViewButtonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  flipButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButton: {
    backgroundColor: '#2C1810',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
    shadowColor: '#000',
    left:130,
    top:10,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  whiteSection: {
    flex: 3,
    backgroundColor: '#fff',
    position: 'relative',
  },
  brownSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 1,
    padding: 10,
    zIndex: 2,
    color: '#0000',
  },
});