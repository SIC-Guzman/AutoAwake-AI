import os
import numpy as np
import xml.etree.ElementTree as ET
import cv2
import matplotlib.pyplot as plt
from PIL import Image
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, losses

# ================================
# CONFIGURACIONES
# ================================
DATA_DIR = './ibug_300W_large_face_landmark_dataset'
IMAGE_DIM = 128
BATCH_SIZE = 16
EPOCHS = 30
CHECKPOINT_DIR = './checkpoints'

if not os.path.exists(CHECKPOINT_DIR):
    os.makedirs(CHECKPOINT_DIR)

# ================================
# AUGMENTATIONS
# ================================
class FaceLandmarksAugmentation:
    def __init__(self, image_dim=128, brightness=0.24, contrast=0.15, saturation=0.3, hue=0.1,
                 face_offset=32, crop_offset=16, rotation_limit=14):
        self.image_dim = image_dim
        self.face_offset = face_offset
        self.crop_offset = crop_offset
        self.rotation_limit = rotation_limit
        self.color_jitter_params = dict(brightness=brightness, contrast=contrast, saturation=saturation)

    def offset_crop(self, image, landmarks, crops_coordinates):
        left = int(crops_coordinates['left'])
        top = int(crops_coordinates['top'])
        width = int(crops_coordinates['width'])
        height = int(crops_coordinates['height'])
        face_offset = self.face_offset

        left_crop = max(0, left - face_offset)
        top_crop = max(0, top - face_offset)
        right_crop = min(image.width, left + width + face_offset)
        bottom_crop = min(image.height, top + height + face_offset)

        image_np = np.array(image)
        image_crop = image_np[top_crop:bottom_crop, left_crop:right_crop]        

        if image_crop.size == 0:
            print("[ERROR] Imagen vacía después del crop!")
            return image, landmarks  # Retornar sin modificar para no romper el pipeline

        landmarks = landmarks - np.array([left_crop, top_crop])

        new_dim = self.image_dim + self.crop_offset        

        image_resized = cv2.resize(image_crop, (new_dim, new_dim))

        # Escalar landmarks proporcionalmente al tamaño real del crop
        crop_width = right_crop - left_crop
        crop_height = bottom_crop - top_crop
        landmarks[:,0] *= new_dim / crop_width
        landmarks[:,1] *= new_dim / crop_height

        return Image.fromarray(image_resized), landmarks


    def random_face_crop(self, image, landmarks):
        image_np = np.array(image)
        h, w = image_np.shape[:2]
        top = np.random.randint(0, h - self.image_dim)
        left = np.random.randint(0, w - self.image_dim)
        image_np = image_np[top:top+self.image_dim, left:left+self.image_dim]
        landmarks = landmarks - np.array([left, top])
        return Image.fromarray(image_np), landmarks

    def random_rotation(self, image, landmarks):
        angle = np.random.uniform(-self.rotation_limit, self.rotation_limit)
        center = (IMAGE_DIM // 2, IMAGE_DIM // 2)
        rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
        image_np = np.array(image)
        image_rot = cv2.warpAffine(image_np, rot_mat, (IMAGE_DIM, IMAGE_DIM))
        landmarks_hom = np.hstack([landmarks, np.ones((landmarks.shape[0],1))])
        landmarks_rot = (rot_mat @ landmarks_hom.T).T
        return Image.fromarray(image_rot), landmarks_rot

    def __call__(self, image, landmarks, crops_coordinates):
        image, landmarks = self.offset_crop(image, landmarks, crops_coordinates)
        image, landmarks = self.random_face_crop(image, landmarks)
        image, landmarks = self.random_rotation(image, landmarks)
        # Color jitter using PIL
        image = tf.image.random_brightness(np.array(image)/255.0, max_delta=self.color_jitter_params['brightness'])
        image = tf.image.random_contrast(image, 1.0 - self.color_jitter_params['contrast'], 1.0 + self.color_jitter_params['contrast'])
        image = tf.image.random_saturation(image, 1.0 - self.color_jitter_params['saturation'], 1.0 + self.color_jitter_params['saturation'])
        image = tf.image.rgb_to_grayscale(image)
        image = (image*2.0)-1.0
        return image, landmarks.astype('float32')

# ================================
# DATASET
# ================================
class LandmarkDataset:
    def __init__(self, data_dir, train=True, preprocessor=None):
        self.data_dir = data_dir
        self.train = train
        self.preprocessor = preprocessor
        self.image_paths = []
        self.landmarks = []
        self.crops_coordinates = []

        xml_file = f'labels_ibug_300W_{"train" if train else "test"}.xml'
        tree = ET.parse(os.path.join(data_dir, xml_file))
        root = tree.getroot()
        for child in root[2]:
            self.image_paths.append(os.path.join(data_dir, child.attrib['file']))
            self.crops_coordinates.append(child[0].attrib)
            lm = [[int(pt.attrib['x']), int(pt.attrib['y'])] for pt in child[0][:68]]
            self.landmarks.append(lm)
        self.landmarks = np.array(self.landmarks, dtype='float32')

    def __len__(self):
        return len(self.image_paths)

    def generator(self):
        for i in range(len(self.image_paths)):
            image = Image.open(self.image_paths[i]).convert('RGB')
            landmarks = self.landmarks[i]
            crops_coordinates = self.crops_coordinates[i]
            if self.preprocessor:
                image, landmarks = self.preprocessor(image, landmarks, crops_coordinates)
            landmarks = (landmarks / IMAGE_DIM) - 0.5  # Normalizado [-0.5,0.5]
            yield image, landmarks.flatten()

    def get_dataset(self):
        output_types = (tf.float32, tf.float32)
        output_shapes = ([IMAGE_DIM, IMAGE_DIM, 1], [136])
        ds = tf.data.Dataset.from_generator(self.generator, output_types=output_types, output_shapes=output_shapes)
        ds = ds.shuffle(1000).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
        return ds

# ================================
# MODEL
# ================================
def depthwise_separable_conv(filters, kernel_size, strides=1):
    return layers.SeparableConv2D(filters, kernel_size, padding='same', strides=strides, use_bias=False)

def build_network(input_shape=(IMAGE_DIM, IMAGE_DIM, 1), num_middle_blocks=8):
    inputs = layers.Input(shape=input_shape)

    # Entry block
    x = layers.Conv2D(32,3,padding='same',use_bias=False)(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(0.2)(x)

    x = layers.Conv2D(64,3,padding='same',use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(0.2)(x)

    # Residual blocks
    def residual_block(x, out_channels):
        shortcut = x
        x = depthwise_separable_conv(out_channels,3)(x)
        x = layers.BatchNormalization()(x)
        x = layers.LeakyReLU(0.2)(x)
        x = depthwise_separable_conv(out_channels,3)(x)
        x = layers.BatchNormalization()(x)
        x = layers.MaxPooling2D(3, strides=2, padding='same')(x)
        shortcut = layers.Conv2D(out_channels,1,strides=2)(shortcut)
        shortcut = layers.BatchNormalization()(shortcut)
        return layers.Add()([x, shortcut])

    x = residual_block(x, 128)
    x = residual_block(x, 256)
    x = residual_block(x, 728)

    # Middle blocks
    for _ in range(num_middle_blocks):
        shortcut = x
        x = layers.LeakyReLU(0.2)(x)
        x = depthwise_separable_conv(728,3)(x)
        x = layers.BatchNormalization()(x)
        x = layers.Add()([x, shortcut])

    # Exit block
    shortcut = layers.Conv2D(1024,1,strides=2)(x)
    shortcut = layers.BatchNormalization()(shortcut)
    x = layers.LeakyReLU(0.2)(x)
    x = depthwise_separable_conv(728,3,strides=1)(x)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(0.2)(x)
    x = depthwise_separable_conv(1024,3,strides=1)(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(3,strides=2,padding='same')(x)
    x = layers.Add()([x, shortcut])
    x = depthwise_separable_conv(1536,3)(x)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(0.2)(x)
    x = depthwise_separable_conv(2048,3)(x)
    x = layers.BatchNormalization()(x)
    x = layers.LeakyReLU(0.2)(x)

    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(136)(x)
    model = models.Model(inputs, outputs)
    return model

# ================================
# ENTRENAMIENTO
# ================================
preprocessor = FaceLandmarksAugmentation()
train_dataset = LandmarkDataset(DATA_DIR, train=True, preprocessor=preprocessor).get_dataset()
val_dataset = LandmarkDataset(DATA_DIR, train=False, preprocessor=preprocessor).get_dataset()

model = build_network()
model.compile(optimizer=optimizers.Adam(0.00075), loss=losses.MeanSquaredError())

# Callbacks
checkpoint_callback = tf.keras.callbacks.ModelCheckpoint(
    os.path.join(CHECKPOINT_DIR, 'best_model.weights.h5'),
    monitor='val_loss',
    save_best_only=True,
    save_weights_only=True
)

# Callback para guardar modelo completo cada vez que mejora
full_model_checkpoint = tf.keras.callbacks.ModelCheckpoint(
    os.path.join(CHECKPOINT_DIR, 'best_model_full.h5'),
    monitor='val_loss',
    save_best_only=True,
    save_weights_only=False  # Aquí guardamos todo el modelo
)

history = model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=EPOCHS,
    callbacks=[checkpoint_callback, full_model_checkpoint]
)

# Guardar modelo final completo al terminar entrenamiento
model.save(os.path.join(CHECKPOINT_DIR, 'final_model.h5'))
print("Modelo completo guardado en final_model.h5")
