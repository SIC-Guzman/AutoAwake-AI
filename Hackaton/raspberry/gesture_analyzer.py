import time
import numpy as np
import mediapipe as mp


class HandHelpGestureDetector:
    """
    Detecta gesto de ayuda mediante PUÑO CERRADO sostenido
    """

    # Landmarks MediaPipe
    FINGER_TIPS = [8, 12, 16, 20]   # Index, Middle, Ring, Pinky
    FINGER_MCP  = [5, 9, 13, 17]    # MCPs correspondientes

    def __init__(
        self,
        fist_threshold=0.35,
        min_closed_fingers=4,
        help_duration=1.5
    ):
        self.fist_threshold = fist_threshold
        self.min_closed_fingers = min_closed_fingers
        self.help_duration = help_duration

        self.help_start = None
        self.alert_sent = False

        mp_hands = mp.solutions.hands
        self.hands = mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )

    def _distance(self, a, b):
        return np.linalg.norm(a - b)

    def update(self, frame_bgr):
        """
        Devuelve:
        (is_fist, closed_fingers, should_alert)
        """
        import cv2

        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)

        if not results.multi_hand_landmarks:
            self.help_start = None
            self.alert_sent = False
            return False, 0, False

        hand = results.multi_hand_landmarks[0]
        h, w, _ = frame_bgr.shape

        lm = np.array([
            (p.x * w, p.y * h)
            for p in hand.landmark
        ])

        closed_fingers = 0

        for tip, mcp in zip(self.FINGER_TIPS, self.FINGER_MCP):
            tip_pos = lm[tip]
            mcp_pos = lm[mcp]

            # Normalización por tamaño de la mano
            palm_size = self._distance(lm[0], lm[9]) + 1e-6
            dist_ratio = self._distance(tip_pos, mcp_pos) / palm_size

            if dist_ratio < self.fist_threshold:
                closed_fingers += 1

        is_fist = closed_fingers >= self.min_closed_fingers
        should_alert = False

        if is_fist:
            if self.help_start is None:
                self.help_start = time.time()

            if (time.time() - self.help_start >= self.help_duration
                    and not self.alert_sent):
                should_alert = True
                self.alert_sent = True
        else:
            self.help_start = None
            self.alert_sent = False

        return is_fist, closed_fingers, should_alert

    def close(self):
        self.hands.close()
