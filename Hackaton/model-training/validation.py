import cv2
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf

# ===========================
# Configuración
# ===========================
MODEL_PATH = './checkpoints/best_model_full.h5'  # modelo completo
IMAGE_PATH = 'test_image.jpeg'               # imagen a predecir
HAAR_CASCADE_PATH = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
IMAGE_DIM = 128  # tamaño que espera tu modelo

# ===========================
# Cargar modelo completo
# ===========================
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

# ===========================
# Cargar imagen y detectar rostro
# ===========================
image = cv2.imread(IMAGE_PATH)
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

face_cascade = cv2.CascadeClassifier(HAAR_CASCADE_PATH)
faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

if len(faces) == 0:
    print("No se detectó ningún rostro.")
    exit()

x, y, w, h = faces[0]  # tomamos la primera cara detectada
face_img = image[y:y+h, x:x+w]

# ===========================
# Preprocesar rostro
# ===========================
face_resized = cv2.resize(face_img, (IMAGE_DIM, IMAGE_DIM))
face_resized = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
face_resized = face_resized / 255.0
face_resized = tf.image.rgb_to_grayscale(face_resized)
face_resized = (face_resized * 2.0) - 1.0  # [-1, 1]
face_resized = np.expand_dims(face_resized, axis=0)  # (1, IMAGE_DIM, IMAGE_DIM, 1)

# ===========================
# Predecir landmarks
# ===========================
preds = model.predict(face_resized)[0]  # (136,)
landmarks = (preds.reshape(-1, 2) + 0.5) * IMAGE_DIM  # des-normalizar

# ===========================
# Dibujar sobre imagen original
# ===========================
image_plot = image.copy()
scale_x = w / IMAGE_DIM
scale_y = h / IMAGE_DIM

for (lx, ly) in landmarks:
    px = int(lx * scale_x + x)
    py = int(ly * scale_y + y)
    cv2.circle(image_plot, (px, py), 5, (0, 255, 0), -1)

plt.imshow(cv2.cvtColor(image_plot, cv2.COLOR_BGR2RGB))
plt.axis('off')
plt.show()
