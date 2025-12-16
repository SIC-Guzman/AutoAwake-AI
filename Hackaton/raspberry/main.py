import cv2
import time
from mqtt_service import mqtt_handler
from ear_analyzer import EARAnalyzer
from gaze_analyzer import GazeAnalyzer


# ================== CONFIG ==================
TARGET_FPS = 15
FRAME_INTERVAL = 1.0 / TARGET_FPS
CAP_WIDTH = 320
CAP_HEIGHT = 240

# ================== INIT ==================
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAP_WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAP_HEIGHT)

ear_analyzer = EARAnalyzer(
    ear_threshold=0.210,
    ear_history_length=5,
    closed_eye_duration=3
)

gaze_analyzer = GazeAnalyzer(
    deviation_threshold=0.15,
    history_length=5,
    looking_away_duration=2.0
)

last_time = time.time()
frame_count = 0

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        now = time.time()
        if now - last_time < FRAME_INTERVAL:
            time.sleep(FRAME_INTERVAL - (now - last_time))
        last_time = time.time()

        frame_count += 1
        if frame_count % 2 != 0:
            continue
        
        direction, deviation, gaze_alert = gaze_analyzer.update(frame)

        # print(direction, deviation, gaze_alert)
        if direction != "CENTER":
            print(f"Mirada desviada: {direction} (dev={deviation:.2f})")

        if gaze_alert:
            mqtt_handler.publish_alert(
                trip_id=1,
                alert_type="LOOKING-AWAY",
                severity="MEDIUM",
                message=f"Driver looking {direction.lower()}"
            )


        ear_avg, eyes_closed, should_alert = ear_analyzer.update(frame)

        if eyes_closed:
            print(f"[Frame {frame_count}] EAR={ear_avg:.3f}, Estado=Ojos Cerrados")

        if should_alert:
            mqtt_handler.publish_alert(
                trip_id=1,
                alert_type="DROWSINESS",
                severity="HIGH",
                message="Driver is drowsy"
            )

except KeyboardInterrupt:
    pass

finally:
    cap.release()
    ear_analyzer.close()
    gaze_analyzer.close()
