import numpy as np
import mediapipe as mp
import time
from collections import deque


class GazeAnalyzer:
    # Ojos: extremos + puntos internos
    LEFT_EYE = [33, 133, 159, 145]
    RIGHT_EYE = [362, 263, 386, 374]

    def __init__(
        self,
        deviation_threshold=0.15,
        history_length=5,
        looking_away_duration=1
    ):
        self.deviation_threshold = deviation_threshold
        self.looking_away_duration = looking_away_duration
        self.history = deque(maxlen=history_length)

        self.looking_away_start = None
        self.alert_sent = False
        self.last_direction = "CENTER"

        mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=False,  # CORRECTO
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def update(self, frame_bgr):
        """
        Devuelve:
        (direction, deviation, should_alert)
        """
        import cv2

        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return self.last_direction, 0.0, False

        face = results.multi_face_landmarks[0]
        h, w, _ = frame_bgr.shape

        lm = np.array([
            (int(p.x * w), int(p.y * h))
            for p in face.landmark
        ])

        # Ojo izquierdo
        lx_outer, lx_inner = lm[33][0], lm[133][0]
        lx_center = np.mean(lm[[159, 145]], axis=0)[0]
        left_ratio = (lx_center - lx_outer) / (lx_inner - lx_outer + 1e-6)

        # Ojo derecho
        rx_outer, rx_inner = lm[362][0], lm[263][0]
        rx_center = np.mean(lm[[386, 374]], axis=0)[0]
        right_ratio = (rx_center - rx_outer) / (rx_inner - rx_outer + 1e-6)

        deviation = ((left_ratio - 0.5) + (right_ratio - 0.5)) / 2.0
        self.history.append(deviation)
        avg_dev = sum(self.history) / len(self.history)
        
        if avg_dev > self.deviation_threshold:            
            direction = "RIGHT"
        elif avg_dev < -self.deviation_threshold:
            direction = "LEFT"
        else:
            direction = "CENTER"

        should_alert = False

        if direction != "CENTER":
            if self.looking_away_start is None:
                self.looking_away_start = time.time()

            if (time.time() - self.looking_away_start >= self.looking_away_duration
                    and not self.alert_sent):
                should_alert = True
                self.alert_sent = True
        else:
            self.looking_away_start = None
            self.alert_sent = False

        self.last_direction = direction
        return direction, avg_dev, should_alert

    def close(self):
        self.face_mesh.close()
