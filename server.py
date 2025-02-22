from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
from flask_cors import CORS
import io

app = Flask(__name__)
CORS(app)  

# Load TensorFlow COCO-SSD model
model = tf.saved_model.load("https://tfhub.dev/tensorflow/ssd_mobilenet_v2/2")

@app.route("/detect", methods=["POST"])
def detect_objects():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image_file = request.files["image"]
    image = Image.open(image_file).convert("RGB")
    image = np.array(image)

    # Convert to TensorFlow format
    img_tensor = tf.convert_to_tensor(image, dtype=tf.uint8)
    img_tensor = tf.image.resize(img_tensor, (300, 300))
    img_tensor = tf.expand_dims(img_tensor, 0)

    detections = model(img_tensor)
    object_names = []

    for i in range(len(detections["detection_scores"][0])):
        if detections["detection_scores"][0][i] > 0.5:
            object_names.append(detections["detection_classes"][0][i].numpy().astype(int))

    return jsonify({"objects": object_names})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
