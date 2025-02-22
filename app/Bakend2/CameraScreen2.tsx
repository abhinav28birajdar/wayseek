// import React, { useState, useRef, useEffect } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
// import { Camera, CameraType } from 'expo-camera';
// import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-react-native';
// import * as cocoSsd from '@tensorflow-models/coco-ssd';

// export default function CameraScreen() {
//   const [facing, setFacing] = useState<'back' | 'front'>('back');
//   const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
//   const [isModelReady, setIsModelReady] = useState(false);
//   const cameraRef = useRef<any>(null);
//   const [permission, requestPermission] = Camera.useCameraPermissions();
//   let objectDetector: cocoSsd.ObjectDetection | null = null;

//   useEffect(() => {
//     async function loadModel() {
//       await tf.ready();
//       objectDetector = await cocoSsd.load();
//       setIsModelReady(true);
//     }
//     loadModel();
//   }, []);

//   const detectObjects = async () => {
//     if (!isModelReady || !cameraRef.current) return;

//     const photo = await cameraRef.current.takePictureAsync({ base64: true });
//     const imageTensor = tf.browser.fromPixels(photo);
//     const predictions = await objectDetector!.detect(imageTensor);

//     const objects = predictions.map((p) => `${p.class} (${Math.round(p.score * 100)}%)`);
//     setDetectedObjects(objects);

//     setTimeout(() => setDetectedObjects([]), 3000);
//   };

//   if (!permission) return <View />;
//   if (!permission.granted) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.text}>We need your permission to access the camera</Text>
//         <TouchableOpacity onPress={requestPermission} style={styles.button}>
//           <Text style={styles.text}>Grant Permission</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Camera Section */}
//       <View style={styles.cameraContainer}>
//       <Camera style={styles.camera} type={facing === 'back' ? CameraType.back : CameraType.front} ref={cameraRef} />
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity style={styles.button} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
//             <Text style={styles.text}>Flip Camera</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={[styles.button, styles.captureButton]} onPress={detectObjects} disabled={!isModelReady}>
//             <Text style={styles.text}>{isModelReady ? 'Detect Objects' : 'Loading Model...'}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Text Section */}
//       <View style={styles.textSection}>
//         <Text style={styles.title}>Detected Objects</Text>
//         {isModelReady ? (
//           detectedObjects.length > 0 ? (
//             detectedObjects.map((object, index) => (
//               <Text key={index} style={styles.detectedText}>{object}</Text>
//             ))
//           ) : (
//             <Text style={styles.noObjectsText}>Tap 'Detect Objects' to analyze</Text>
//           )
//         ) : (
//           <ActivityIndicator size="large" color="blue" />
//         )}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   cameraContainer: { flex: 2 },
//   camera: { flex: 1 },
//   buttonContainer: {
//     position: 'absolute',
//     bottom: 20,
//     alignSelf: 'center',
//     flexDirection: 'row',
//     gap: 20,
//   },
//   button: {
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     padding: 10,
//     borderRadius: 5,
//   },
//   captureButton: { backgroundColor: 'rgba(0, 100, 0, 0.5)' },
//   text: { fontSize: 18, color: 'white' },
//   textSection: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
//   detectedText: { fontSize: 16, color: '#333' },
//   noObjectsText: { fontSize: 16, color: '#666' },
// });
