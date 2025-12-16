# Prueba en PC de escritorio con Flask
from flask import Flask, Response, render_template_string
import cv2
import numpy as np
import tensorflow as tf
from collections import deque

# ======================================
# Inicializar Flask
# ======================================
app = Flask(__name__)

# ======================================
# Sensibilidad para EAR
# ======================================
EAR_THRESHOLD = 0.4  # Ajusta según pruebas
EAR_HISTORY_LENGTH = 5  # Número de frames para promediar
ear_history = deque(maxlen=EAR_HISTORY_LENGTH)

# ======================================
# Cargar modelo TFLite
# ======================================
interpreter = tf.lite.Interpreter(model_path="landmarks_model.tflite")
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# ======================================
# Cargar Haar Cascade para rostro
# ======================================
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# ======================================
# Función para calcular EAR
# ======================================
def eye_aspect_ratio(eye):
    A = np.linalg.norm(eye[1] - eye[5])
    B = np.linalg.norm(eye[2] - eye[4])
    C = np.linalg.norm(eye[0] - eye[3])
    return (A + B) / (2.0 * C)

# ======================================
# Generador de frames
# ======================================
def gen_frames():
    cap = cv2.VideoCapture(0)
    while True:
        success, frame = cap.read()
        if not success:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

        for (x, y, w, h) in faces:
            # --- Crop con offset ---
            face_offset = 20
            left_crop = max(0, x - face_offset)
            top_crop = max(0, y - face_offset)
            right_crop = min(frame.shape[1], x + w + face_offset)
            bottom_crop = min(frame.shape[0], y + h + face_offset)
            crop_w = right_crop - left_crop
            crop_h = bottom_crop - top_crop

            # --- Preprocesar para el modelo ---
            face_crop = frame[top_crop:bottom_crop, left_crop:right_crop]
            face_input = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
            image_dim = input_details[0]['shape'][1]
            face_input = cv2.resize(face_input, (image_dim, image_dim))
            face_input = face_input.astype(np.float32) / 255.0
            face_input = np.expand_dims(face_input, axis=0)
            face_input = np.expand_dims(face_input, axis=-1)

            # --- Inferencia ---
            interpreter.set_tensor(input_details[0]['index'], face_input)
            interpreter.invoke()
            landmarks = interpreter.get_tensor(output_details[0]['index'])[0].reshape(-1, 2)

            # --- Escalar landmarks al tamaño original de la cara ---
            landmarks[:,0] = landmarks[:,0] * crop_w / image_dim + left_crop
            landmarks[:,1] = landmarks[:,1] * crop_h / image_dim + top_crop

            # --- Calcular EAR ---
            left_eye = landmarks[36:42]  # Ajusta según indices reales
            right_eye = landmarks[42:48]
            left_ear = eye_aspect_ratio(left_eye)
            right_ear = eye_aspect_ratio(right_eye)
            ear = (left_ear + right_ear) / 2.0

            # --- Promedio temporal de EAR ---
            ear_history.append(ear)
            ear_avg = sum(ear_history) / len(ear_history)

            # --- Mostrar EAR y estado ---
            state_text = "Ojos cerrados" if ear_avg < EAR_THRESHOLD else "Ojos abiertos"
            cv2.putText(frame, f"EAR: {ear_avg:.3f} - {state_text}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        # --- Devolver frame ---
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# ======================================
# Rutas Flask
# ======================================
@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    html = """
    <html>
        <head><title>Video EAR</title></head>
        <body>
            <h1>Video en vivo con EAR</h1>
            <img src="{{ url_for('video_feed') }}" width="720">
        </body>
    </html>
    """
    return render_template_string(html)

# ======================================
# Ejecutar app
# ======================================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
