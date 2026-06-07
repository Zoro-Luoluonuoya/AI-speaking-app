import os
import re
import base64
import struct
import subprocess
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from openai import OpenAI

router = APIRouter()

FFMPEG = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    ".venv",
    "Lib",
    "site-packages",
    "imageio_ffmpeg",
    "binaries",
    "ffmpeg-win-x86_64-v7.1.exe",
)


def _get_ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return FFMPEG


def get_client() -> OpenAI:
    return OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL"),
        timeout=60.0,
    )


def convert_to_wav(webm_bytes: bytes) -> bytes:
    ffmpeg = _get_ffmpeg()
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as src:
        src.write(webm_bytes)
        src_path = src.name
    dst_path = src_path.replace(".webm", ".wav")
    try:
        subprocess.run(
            [ffmpeg, "-y", "-i", src_path, "-ar", "16000", "-ac", "1", dst_path],
            check=True,
            capture_output=True,
        )
        with open(dst_path, "rb") as f:
            return f.read()
    finally:
        for p in (src_path, dst_path):
            try:
                os.remove(p)
            except OSError:
                pass


def get_wav_duration(wav_bytes: bytes) -> float:
    """Parse WAV header to get duration in seconds."""
    if len(wav_bytes) < 44 or wav_bytes[:4] != b"RIFF" or wav_bytes[8:12] != b"WAVE":
        return 0.0
    try:
        # Find 'data' chunk (may not be at fixed offset due to LIST/INFO chunks)
        pos = 12
        data_size = 0
        byte_rate = struct.unpack_from("<I", wav_bytes, 28)[0]
        while pos < len(wav_bytes) - 8:
            chunk_id = wav_bytes[pos : pos + 4]
            chunk_size = struct.unpack_from("<I", wav_bytes, pos + 4)[0]
            if chunk_id == b"data":
                data_size = chunk_size
                break
            pos += 8 + chunk_size
            if chunk_size % 2 != 0:
                pos += 1  # padding
        if byte_rate == 0 or data_size == 0:
            return 0.0
        return data_size / byte_rate
    except (struct.error, IndexError):
        return 0.0


def calculate_confidence(
    text: str,
    duration: float,
    no_speech_prob: float,
) -> int:
    """
    Multi-factor pronunciation confidence score (0-100).

    Factors:
      1. Audio duration   — too short = accidental tap
      2. No-speech prob   — noise / silence detection
      3. Text quality     — ASCII purity, word count, repetition
    """
    # ── Factor 1: Duration gate ──────────────────────────────
    if duration < 1.0:
        return 0
    duration_score = min(duration / 5.0, 1.0) * 100  # 0-5s linear ramp

    # ── Factor 2: No-speech penalty ──────────────────────────
    # no_speech_prob: 0 = definitely speech, 1 = definitely not speech
    no_speech_penalty = max(0, 1.0 - no_speech_prob * 2)  # >0.5 → heavy penalty

    # ── Factor 3: Text quality ───────────────────────────────
    text_score = 100
    if not text.strip():
        text_score = 0
    else:
        ascii_ratio = sum(1 for c in text if c.isascii()) / len(text)
        if ascii_ratio < 0.5:
            text_score -= 30
        elif ascii_ratio < 0.8:
            text_score -= 10

        words = text.split()
        word_count = len(words)
        if word_count < 2:
            text_score -= 40
        elif word_count < 5:
            text_score -= 15

        if words:
            avg_word_len = sum(len(w) for w in words) / word_count
            if avg_word_len > 12:
                text_score -= 15

        repeated = re.findall(r"(.)\1{2,}", text)
        text_score -= len(repeated) * 5
        text_score = max(0, text_score)

    # ── Weighted composite ───────────────────────────────────
    raw = (
        duration_score * 0.25
        + no_speech_penalty * 100 * 0.35
        + text_score * 0.40
    )
    final = int(max(0, min(100, raw * no_speech_penalty)))
    return final


@router.post("")
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")

    if file.content_type != "audio/wav":
        try:
            audio_bytes = convert_to_wav(audio_bytes)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Audio conversion failed: {e}"
            )

    duration = get_wav_duration(audio_bytes)
    if duration < 1.0:
        return {"text": "", "confidence": 0, "duration": round(duration, 2), "no_speech_prob": 0.0}

    b64_data = base64.b64encode(audio_bytes).decode()
    data_url = f"data:audio/wav;base64,{b64_data}"

    try:
        client = get_client()
        completion = client.chat.completions.create(
            model="mimo-v2.5-asr",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_audio",
                            "input_audio": {
                                "data": data_url,
                                "format": "wav",
                            },
                        },
                    ],
                }
            ],
        )
        text = completion.choices[0].message.content or ""

        # MiMo doesn't return no_speech_prob natively; estimate from text patterns
        no_speech_prob = 0.0
        if not text.strip():
            no_speech_prob = 0.9
        elif len(text.strip()) < 3:
            no_speech_prob = 0.6
        elif not any(c.isascii() and c.isalpha() for c in text):
            no_speech_prob = 0.7

        confidence = calculate_confidence(text, duration, no_speech_prob)
        return {
            "text": text,
            "confidence": confidence,
            "duration": round(duration, 2),
            "no_speech_prob": round(no_speech_prob, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
