# Facial Landmarks Detection - Entrenamiento

Este proyecto implementa un sistema de detección de **landmarks faciales** entrenado con TensorFlow/Keras. Está diseñado para replicar resultados de entrenamiento y generar modelos que luego pueden ser convertidos a TFLite para inferencia en dispositivos como Raspberry Pi.

---

## 1. Requisitos

```bash
pip install -r requirements.txt
```

Dependencias principales:

* TensorFlow 2.20
* OpenCV (`opencv-python-headless`)
* Pillow
* Numpy
* Matplotlib
* Flask
* KaggleHub (para descargar datasets)

*(El `requirements.txt` completo incluye librerías auxiliares para manejo de datasets, métricas y utilidades de entrenamiento.)*

>[!IMPORTANT]
> Se utilizó una tarjeta gráfica NVIDIA RTX 3050 de 6GB y CUDA 12.3

---

## 2. Configuraciones de Entrenamiento

```python
DATA_DIR = './ibug_300W_large_face_landmark_dataset'  # Directorio de imágenes
IMAGE_DIM = 128                                     # Resolución de entrada
BATCH_SIZE = 16
EPOCHS = 30
CHECKPOINT_DIR = './checkpoints'                   # Directorio de checkpoints
```

Se crean automáticamente los checkpoints si no existen.

---

## 3. Data Augmentation

Se aplican técnicas para robustecer el modelo:

* **Offset crop:** recorta la cara considerando un margen extra.
* **Random face crop:** recorte aleatorio dentro de la imagen.
* **Random rotation:** rotación aleatoria de ±14 grados.
* **Color jitter:** brillo, contraste y saturación aleatorios.
* **Conversión a escala de grises y normalización:** valores en [-1,1].

Todas estas transformaciones se aplican mediante la clase `FaceLandmarksAugmentation`.

---

## 4. Dataset

Se utiliza la clase `LandmarkDataset` para procesar los datos:

* Dataset basado en **iBUG/300-W** (landmarks faciales 68 puntos).
* Normaliza los landmarks a [-0.5,0.5].
* Devuelve un `tf.data.Dataset` listo para entrenar con batching y prefetch.

---

## 5. Arquitectura del Modelo

Modelo convolucional profundo con bloques residuales y separables:

* **Entry block:** Conv2D + BatchNorm + LeakyReLU
* **Residual blocks:** convoluciones separables con shortcut
* **Middle blocks:** 8 bloques residuales con skip connections
* **Exit block:** combinación de convoluciones profundas, pooling y LeakyReLU
* **Salida:** Dense con 136 unidades (68 landmarks × 2 coordenadas)

Se construye usando la función `build_network()`.

---

## 6. Entrenamiento

* Optimizer: **Adam**, lr=0.00075
* Loss: **Mean Squared Error**
* Callbacks:

  * Guardar los mejores pesos (`best_model.weights.h5`)
  * Guardar el modelo completo (`best_model_full.h5`)
* Se guarda el modelo final al terminar en `final_model.h5`.

```bash
python train.py
```

---

## Prueba del modelo

Se muestra un ejemplo de cómo se procesa una imagen con el modelo entrenado. La imagen de entrada se reescala para que no sea muy grande.

**Entrada**:

<img src="./imgs/test_image.jpeg" width="224">

**Salida**:

<img src="./imgs/prueba.png" width="224">

