import tensorflow as tf

# Cargar tu modelo completo
model = tf.keras.models.load_model("./checkpoints/best_model_full.h5")

# Convertir a TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# Opcional: optimización por cuantización (reduce tamaño y CPU usage)
converter.optimizations = [tf.lite.Optimize.DEFAULT]

tflite_model = converter.convert()

# Guardar
with open("landmarks_model.tflite", "wb") as f:
    f.write(tflite_model)

print("Modelo TFLite guardado, tamaño mucho menor!")
