import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet, Text } from 'react-native'; // Import Text here
import { Camera, CameraType } from 'expo-camera'; // Import Camera and CameraType from expo-camera

// Your Camera Screen component
function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState<CameraType>(CameraType.back); // Use CameraType here
  const [cameraRef, setCameraRef] = useState<Camera | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync(); // Request camera permission
      setHasPermission(status === 'granted'); // Set permission state
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const toggleCameraType = () => {
    setType((prevType: CameraType) => // Add type annotation for prevType
      prevType === CameraType.back
        ? CameraType.front
        : CameraType.back
    );
  };

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      console.log(photo.uri); // Log the picture URI
    }
  };

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={setCameraRef}>
        <View style={styles.buttonContainer}>
          <Button title="Flip Camera" onPress={toggleCameraType} />
          <Button title="Take Picture" onPress={takePicture} />
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    width: '100%',
  },
});

export default CameraScreen;