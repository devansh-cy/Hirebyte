import time
from fastapi import APIRouter, WebSocket
from config.state import session_data
from services.video_service import process_video_frame, Stabilizer

router = APIRouter()

@router.websocket("/ws/video")
async def video_websocket(websocket: WebSocket):
    await websocket.accept()
    stabilizer = Stabilizer()
    
    try:
        while True:
            data = await websocket.receive_text()
            # data is expected to be a base64 string
            result = process_video_frame(data, stabilizer)
            if result:
                # Store metric with timestamp
                metric_entry = {
                    "timestamp": time.time(),
                    "focus": result["focus"],
                    "emotion": result["emotion"],
                    "confidence": result["confidence"],
                    "stress": result["stress"]
                }
                session_data["video_metrics"].append(metric_entry)
                
                await websocket.send_json(result)
    except Exception as e:
        print(f"Video WebSocket error: {e}")

@router.post("/api/stop-camera")
async def stop_camera():
    """Stop camera - handled client-side via WebRTC, this is a no-op acknowledgment"""
    return {"status": "ok", "message": "Camera stop acknowledged"}
