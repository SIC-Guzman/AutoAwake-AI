import numpy as np
import mediapipe as mp
import time
from collections import deque


class EARAnalyzer:
    LEFT_EYE_IDX = [33, 160, 158, 133, 153, 144]
    RIGHT_EYE_IDX = [362, 385, 387, 263, 373, 380]

    def __init__(
        self,
        ear_threshold=0.215,
        ear_history_length=5,
        closed_eye_duration=3,
    ):
        self.ear_threshold = ear_threshold
        self.closed_eye_duration = closed_eye_duration
        self.ear_history = deque(maxlen=ear_history_length)

        self.last_ear_avg = 0.0
        self.closed_eyes_start = None
        self.alert_sent = False

        mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    @staticmethod
    def _eye_aspect_ratio(eye):
        A = np.linalg.norm(eye[1] - eye[5])
        B = np.linalg.norm(eye[2] - eye[4])
        C = np.linalg.norm(eye[0] - eye[3])
        return (A + B) / (2.0 * C + 1e-6)

    def update(self, frame_bgr):
        """
        Procesa un frame y devuelve:
        (ear_avg, eyes_closed, should_alert)
        """
        import cv2

        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if results.multi_face_landmarks:
            face_landmarks = results.multi_face_landmarks[0]
            h, w, _ = frame_bgr.shape

            landmarks = np.array([
                (int(lm.x * w), int(lm.y * h))
                for lm in face_landmarks.landmark
            ])

            left_eye = landmarks[self.LEFT_EYE_IDX]
            right_eye = landmarks[self.RIGHT_EYE_IDX]

            ear = (
                self._eye_aspect_ratio(left_eye) +
                self._eye_aspect_ratio(right_eye)
            ) / 2.0

            self.ear_history.append(ear)
            self.last_ear_avg = sum(self.ear_history) / len(self.ear_history)

        eyes_closed = self.last_ear_avg < self.ear_threshold
        should_alert = False

        if eyes_closed:
            if self.closed_eyes_start is None:
                self.closed_eyes_start = time.time()

            elapsed = time.time() - self.closed_eyes_start
            if elapsed >= self.closed_eye_duration and not self.alert_sent:
                should_alert = True
                self.alert_sent = True
        else:
            self.closed_eyes_start = None
            self.alert_sent = False

        return self.last_ear_avg, eyes_closed, should_alert

    def close(self):
        self.face_mesh.close()
