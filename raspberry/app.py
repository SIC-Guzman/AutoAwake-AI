import cv2
import numpy as np
from tflite_runtime.interpreter import Interpreter
from mqtt_service import mqtt_handler
from collections import deque
import time

# Configuración
EAR_THRESHOLD = 0.4
EAR_HISTORY_LENGTH = 5
CLOSED_EYE_DURATION = 3  # segundos antes de enviar alerta
ear_history = deque(maxlen=EAR_HISTORY_LENGTH)

CAP_WIDTH = 320
CAP_HEIGHT = 240
TARGET_FPS = 15
FRAME_INTERVAL = 1.0 / TARGET_FPS
MODEL_PATH = "landmarks_model_int8.tflite"
NUM_THREADS = 4

# Cargar modelo TFLite
interpreter = Interpreter(model_path=MODEL_PATH, num_threads=NUM_THREADS)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
input_dim = input_details[0]['shape'][1]
input_scale, input_zero_point = input_details[0]['quantization']

# Haar Cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def eye_aspect_ratio(eye):
    A = np.linalg.norm(eye[1] - eye[5])
    B = np.linalg.norm(eye[2] - eye[4])
    C = np.linalg.norm(eye[0] - eye[3])
    eps = 1e-6
    return min((A + B) / (2.0 * C + eps), 5.0)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAP_WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAP_HEIGHT)

frame_count = 0
last_time = time.time()
last_ear_avg = 0.0
alert_sent = False
closed_eyes_start = None  # Marca el tiempo en que se detectaron ojos cerrados

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        # Limitar FPS
        now = time.time()
        if now - last_time < FRAME_INTERVAL:
            time.sleep(FRAME_INTERVAL - (now - last_time))
        last_time = time.time()

        frame_count += 1
        if frame_count % 2 != 0:
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=3, minSize=(50,50))

        if len(faces) > 0:
            for (x, y, w, h) in faces:
                x1, y1 = max(0, x-10), max(0, y-10)
                x2, y2 = min(frame.shape[1], x+w+10), min(frame.shape[0], y+h+10)
                crop_w, crop_h = x2 - x1, y2 - y1

                face_crop = gray[y1:y2, x1:x2]
                face_resized = cv2.resize(face_crop, (input_dim, input_dim))

                face_input = np.clip((face_resized / 255.0 / input_scale + input_zero_point), -128, 127).astype(np.int8)
                face_input = face_input[np.newaxis, ..., np.newaxis]

                interpreter.set_tensor(input_details[0]['index'], face_input)
                interpreter.invoke()
                landmarks = interpreter.get_tensor(output_details[0]['index'])[0].reshape(-1,2)

                landmarks[:,0] = landmarks[:,0]*crop_w/input_dim + x1
                landmarks[:,1] = landmarks[:,1]*crop_h/input_dim + y1

                left_eye = landmarks[36:42]
                right_eye = landmarks[42:48]
                ear = (eye_aspect_ratio(left_eye) + eye_aspect_ratio(right_eye))/2.0
                ear_history.append(ear)
                last_ear_avg = sum(ear_history)/len(ear_history)
        else:
            last_ear_avg = last_ear_avg

        # Detección de somnolencia con timer
        if last_ear_avg < EAR_THRESHOLD:
            print(f"[Frame {frame_count}] EAR={last_ear_avg:.3f}, Estado=Ojos Cerrados")
            if closed_eyes_start is None:
                closed_eyes_start = time.time()  # Inicia el timer

            elapsed = time.time() - closed_eyes_start
            if elapsed >= CLOSED_EYE_DURATION and not alert_sent:
                mqtt_handler.publish_alert(
                    trip_id=1,
                    alert_type="DROWSINESS",
                    severity="HIGH",
                    message="Driver is drowsy"
                )
                alert_sent = True
        else:
            closed_eyes_start = None  # Reset timer
            alert_sent = False

except KeyboardInterrupt:
    pass

finally:
    cap.release()
