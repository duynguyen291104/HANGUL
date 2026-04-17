from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Any

app = Flask(__name__)
CORS(app)

try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None

try:
    from gtts import gTTS
except Exception:
    gTTS = None

try:
    from faster_whisper import WhisperModel
except Exception:
    WhisperModel = None

try:
    from google import genai
    from google.genai import types
except Exception:
    genai = None
    types = None


BASE_DIR = Path(__file__).resolve().parent

if load_dotenv is not None:
    for env_file in [BASE_DIR / ".env", BASE_DIR.parent / ".env", BASE_DIR.parent / "BE" / ".env"]:
        if env_file.exists():
            load_dotenv(env_file, override=False)


def get_env(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return default


GEMINI_API_KEY = get_env("GEMINI_API_KEY", "Gemini_API_KEY")
GEMINI_MODEL = get_env("GEMINI_MODEL", default="gemini-2.5-flash-lite")
WHISPER_MODEL_SIZE = get_env("WHISPER_MODEL_SIZE", default="base")
WHISPER_DEVICE = get_env("WHISPER_DEVICE", default="cpu")
WHISPER_COMPUTE_TYPE = get_env("WHISPER_COMPUTE_TYPE", default="int8")

gemini_client = None
if genai is not None and GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        gemini_client = None

whisper_model = None
if WhisperModel is not None:
    try:
        whisper_model = WhisperModel(
            WHISPER_MODEL_SIZE,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE,
        )
    except Exception:
        whisper_model = None

tts_cache: dict[str, str] = {}


def clamp_score(value: Any, default: int = 0) -> int:
    try:
        return max(0, min(100, round(float(value))))
    except Exception:
        return default


def normalize_text(value: str) -> str:
    value = (value or "").lower().strip()
    value = re.sub(r"[^\w\s가-힣]", " ", value, flags=re.UNICODE)
    return re.sub(r"\s+", " ", value).strip()


def split_syllables(value: str) -> list[str]:
    return list(normalize_text(value).replace(" ", ""))


def levenshtein(left: str, right: str) -> int:
    if left == right:
        return 0
    if not left:
        return len(right)
    if not right:
        return len(left)

    rows = [[0] * (len(right) + 1) for _ in range(len(left) + 1)]
    for i in range(len(left) + 1):
        rows[i][0] = i
    for j in range(len(right) + 1):
        rows[0][j] = j

    for i in range(1, len(left) + 1):
        for j in range(1, len(right) + 1):
            cost = 0 if left[i - 1] == right[j - 1] else 1
            rows[i][j] = min(
                rows[i - 1][j] + 1,
                rows[i][j - 1] + 1,
                rows[i - 1][j - 1] + cost,
            )

    return rows[len(left)][len(right)]


def similarity_score(recognized: str, target: str) -> int:
    recognized = normalize_text(recognized)
    target = normalize_text(target)

    if not recognized or not target:
        return 0

    distance = levenshtein(recognized, target)
    max_len = max(len(recognized), len(target))
    return clamp_score(((max_len - distance) / max_len) * 100)


def extract_extension_from_data_url(data_url: str) -> tuple[str, str]:
    if "," in data_url:
        header, raw = data_url.split(",", 1)
    else:
        header, raw = "", data_url

    mime = "audio/webm"
    if ":" in header and ";" in header:
        mime = header.split(":", 1)[1].split(";", 1)[0].strip().lower()

    ext_map = {
        "audio/webm": ".webm",
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/mpeg": ".mp3",
        "audio/mp3": ".mp3",
        "audio/mp4": ".m4a",
        "audio/m4a": ".m4a",
        "audio/ogg": ".ogg",
        "audio/flac": ".flac",
    }

    return ext_map.get(mime, ".webm"), raw


def save_audio_temp_file(audio_data_url: str) -> str:
    suffix, raw = extract_extension_from_data_url(audio_data_url)
    audio_bytes = base64.b64decode(raw)

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    temp_file.write(audio_bytes)
    temp_file.close()
    return temp_file.name


def transcribe_with_local_whisper(audio_path: str) -> str:
    if whisper_model is None:
        raise RuntimeError("Whisper local chưa được khởi tạo. Kiểm tra faster-whisper và model size.")

    segments, _ = whisper_model.transcribe(
        audio_path,
        language="ko",
        task="transcribe",
        beam_size=1,
        vad_filter=False,
        condition_on_previous_text=False,
        compression_ratio_threshold=2.4,
        no_speech_threshold=0.6,
    )

    transcript = " ".join(segment.text for segment in segments).strip()
    return transcript


def detect_pronunciation_issues(transcript: str, target: str) -> list[dict[str, Any]]:
    target_syllables = split_syllables(target)
    transcript_syllables = split_syllables(transcript)
    issues: list[dict[str, Any]] = []

    if not transcript_syllables:
        return [{
            "unit": target,
            "error_type": "Unclear",
            "score": 20,
            "advice_vi": "Hệ thống không nghe rõ phần bạn đọc. Hãy nói chậm hơn và đứng gần micro hơn."
        }]

    if len(transcript_syllables) < len(target_syllables):
        missing = "".join(target_syllables[len(transcript_syllables):]) or target
        issues.append({
            "unit": missing,
            "error_type": "Omission",
            "score": 45,
            "advice_vi": f"Bạn đang đọc thiếu phần '{missing}'. Hãy phát âm đủ toàn bộ âm tiết."
        })

    if len(transcript_syllables) > len(target_syllables):
        extra = "".join(transcript_syllables[len(target_syllables):]) or transcript
        issues.append({
            "unit": extra,
            "error_type": "Insertion",
            "score": 40,
            "advice_vi": f"Bạn đang thêm dư phần '{extra}'. Hãy đọc gọn hơn và bám sát từ mẫu."
        })

    mismatch_index = -1
    for index, syllable in enumerate(target_syllables):
        if index >= len(transcript_syllables) or transcript_syllables[index] != syllable:
            mismatch_index = index
            break

    if mismatch_index >= 0:
        expected = target_syllables[mismatch_index]
        heard = transcript_syllables[mismatch_index] if mismatch_index < len(transcript_syllables) else "bị thiếu"
        issues.append({
            "unit": expected,
            "error_type": "Mispronunciation",
            "score": 55,
            "advice_vi": f"Âm tiết thứ {mismatch_index + 1} nên là '{expected}', nhưng hệ thống nghe gần giống '{heard}'."
        })

    if target_syllables and transcript_syllables and transcript_syllables[-1] != target_syllables[-1]:
        issues.append({
            "unit": target_syllables[-1],
            "error_type": "Mispronunciation",
            "score": 58,
            "advice_vi": f"Âm cuối '{target_syllables[-1]}' chưa rõ. Hãy nhấn rõ phần kết thúc hơn."
        })

    if normalize_text(transcript) == normalize_text(target):
        issues = [{
            "unit": target,
            "error_type": "Unclear",
            "score": 82,
            "advice_vi": "Transcript đã khớp với từ mục tiêu. Đây vẫn là đánh giá dựa trên transcript nên bạn hãy luyện thêm ngữ điệu và âm cuối."
        }]

    deduped: list[dict[str, Any]] = []
    seen = set()
    for item in issues:
        key = (item["unit"], item["error_type"], item["advice_vi"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    return deduped[:5]


def build_rule_based_assessment(transcript: str, target: str) -> dict[str, Any]:
    accuracy = similarity_score(transcript, target)

    if normalize_text(transcript) == normalize_text(target):
        accuracy = min(accuracy, 88)
        fluency = 81
        prosody = 75
        overall = 83
    else:
        fluency = clamp_score(accuracy - 6 if accuracy > 10 else accuracy)
        prosody = clamp_score(accuracy - 10 if accuracy > 15 else accuracy)
        overall = clamp_score((accuracy * 0.55) + (fluency * 0.25) + (prosody * 0.20))

    issues = detect_pronunciation_issues(transcript, target)

    if issues:
        feedback_vi = issues[0]["advice_vi"]
    elif overall >= 85:
        feedback_vi = "Bạn đọc khá đúng từ mục tiêu. Hãy luyện thêm ngữ điệu để tự nhiên hơn."
    elif overall >= 65:
        feedback_vi = "Bạn đọc gần đúng, nhưng vẫn cần chỉnh lại nhịp đọc và âm cuối."
    else:
        feedback_vi = "Bạn cần đọc chậm hơn và tách rõ từng âm tiết."

    return {
        "metrics": {
            "overall": clamp_score(overall),
            "accuracy": clamp_score(accuracy),
            "fluency": clamp_score(fluency),
            "prosody": clamp_score(prosody),
        },
        "issues": issues,
        "feedback_vi": feedback_vi,
    }


def should_skip_gemini(transcript: str, target: str, baseline: dict[str, Any]) -> bool:
    normalized_transcript = normalize_text(transcript)
    normalized_target = normalize_text(target)
    overall = baseline["metrics"]["overall"]

    if not gemini_client:
        return True

    if normalized_transcript == normalized_target and overall >= 80:
        return True

    if overall >= 86:
        return True

    return False


def build_gemini_prompt(target: str, transcript: str, baseline: dict[str, Any]) -> str:
    return f"""
Bạn là giám khảo luyện phát âm tiếng Hàn cho người Việt.

Từ mục tiêu:
"{target}"

Transcript từ local Whisper:
"{transcript}"

Baseline assessment:
{json.dumps(baseline, ensure_ascii=False)}

Yêu cầu:
1. So sánh transcript với target.
2. Điều chỉnh baseline nếu cần.
3. Đây chỉ là transcript-based assessment, không phải phoneme-level assessment.
4. Không được khen quá mức nếu transcript lệch target.
5. Nếu transcript trùng target, không được tự động cho điểm 95-100.
6. Feedback phải bằng tiếng Việt, ngắn gọn, thực tế.
7. Trả đúng JSON, không markdown.

Schema:
{{
  "metrics": {{
    "overall": 0,
    "accuracy": 0,
    "fluency": 0,
    "prosody": 0
  }},
  "issues": [
    {{
      "unit": "string",
      "error_type": "Mispronunciation|Omission|Insertion|Unclear",
      "score": 0,
      "advice_vi": "string"
    }}
  ],
  "feedback_vi": "string"
}}
""".strip()


def parse_json_response(text: str) -> dict[str, Any]:
    cleaned = text.strip()

    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("{") and part.endswith("}"):
                cleaned = part
                break
            if "\n" in part:
                candidate = part.split("\n", 1)[1].strip()
                if candidate.startswith("{") and candidate.endswith("}"):
                    cleaned = candidate
                    break

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        cleaned = cleaned[start:end + 1]

    return json.loads(cleaned)


def normalize_gemini_assessment(payload: dict[str, Any], transcript: str, target: str, baseline: dict[str, Any]) -> dict[str, Any]:
    raw_metrics = payload.get("metrics", {}) if isinstance(payload, dict) else {}
    raw_issues = payload.get("issues", []) if isinstance(payload, dict) else []
    feedback_vi = str(payload.get("feedback_vi", "")).strip() if isinstance(payload, dict) else ""

    baseline_metrics = baseline["metrics"]

    metrics = {
        "overall": clamp_score(raw_metrics.get("overall", baseline_metrics["overall"])),
        "accuracy": clamp_score(raw_metrics.get("accuracy", baseline_metrics["accuracy"])),
        "fluency": clamp_score(raw_metrics.get("fluency", baseline_metrics["fluency"])),
        "prosody": clamp_score(raw_metrics.get("prosody", baseline_metrics["prosody"])),
    }

    if normalize_text(transcript) == normalize_text(target):
        metrics["overall"] = min(metrics["overall"], 88)
        metrics["accuracy"] = min(metrics["accuracy"], 90)

    issues: list[dict[str, Any]] = []
    if isinstance(raw_issues, list):
        for item in raw_issues[:5]:
            if not isinstance(item, dict):
                continue

            issues.append({
                "unit": str(item.get("unit", target)).strip() or target,
                "error_type": str(item.get("error_type", "Unclear")).strip() or "Unclear",
                "score": clamp_score(item.get("score", 0)),
                "advice_vi": str(item.get("advice_vi", "")).strip() or f"Phần '{target}' cần đọc rõ hơn.",
            })

    if not issues:
        issues = baseline["issues"]

    if not feedback_vi:
        feedback_vi = baseline["feedback_vi"]

    return {
        "metrics": metrics,
        "issues": issues,
        "feedback_vi": feedback_vi,
    }


def analyze_with_gemini(transcript: str, target: str, baseline: dict[str, Any]) -> dict[str, Any]:
    prompt = build_gemini_prompt(target, transcript, baseline)

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.15,
            response_mime_type="application/json",
        ) if types is not None else None,
    )

    parsed = parse_json_response(response.text)
    return normalize_gemini_assessment(parsed, transcript, target, baseline)


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "hangul-pronunciation-ai",
        "gemini_configured": bool(gemini_client),
        "whisper_configured": bool(whisper_model),
        "gemini_model": GEMINI_MODEL,
        "whisper_model": WHISPER_MODEL_SIZE,
        "whisper_device": WHISPER_DEVICE,
        "whisper_compute_type": WHISPER_COMPUTE_TYPE,
    })


@app.post("/tts")
def tts():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()

    if not text:
        return jsonify({"error": "Text required"}), 400

    if text in tts_cache:
        return jsonify({
            "success": True,
            "text": text,
            "audio": tts_cache[text]
        })

    if gTTS is None:
        return jsonify({"error": "gTTS is unavailable"}), 500

    try:
        buffer = io.BytesIO()
        tts_engine = gTTS(text=text, lang="ko", slow=False)
        tts_engine.write_to_fp(buffer)
        buffer.seek(0)
        audio_content = buffer.read()

        audio_base64 = base64.b64encode(audio_content).decode("utf-8")
        audio_data_url = f"data:audio/mpeg;base64,{audio_base64}"
        tts_cache[text] = audio_data_url

        return jsonify({
            "success": True,
            "text": text,
            "audio": audio_data_url
        })
    except Exception as error:
        return jsonify({
            "success": False,
            "error": "tts_failed",
            "message": str(error),
        }), 502


@app.post("/transcribe")
def transcribe():
    data = request.get_json(silent=True) or {}
    audio_data = data.get("audio")
    target = (data.get("target") or "").strip()

    if not audio_data:
        return jsonify({
            "success": False,
            "error": "audio_required",
            "message": "Thiếu dữ liệu audio."
        }), 400

    if not target:
        return jsonify({
            "success": False,
            "error": "target_required",
            "message": "Thiếu từ mục tiêu."
        }), 400

    if whisper_model is None:
        return jsonify({
            "success": False,
            "error": "whisper_not_configured",
            "message": "Whisper local chưa sẵn sàng. Hãy kiểm tra faster-whisper và model."
        }), 503

    temp_audio_path = None

    try:
        temp_audio_path = save_audio_temp_file(audio_data)
        transcript = transcribe_with_local_whisper(temp_audio_path)

        if not transcript:
            return jsonify({
                "success": False,
                "error": "empty_transcript",
                "message": "Không nhận diện được transcript từ audio."
            }), 422

        baseline = build_rule_based_assessment(transcript, target)

        if should_skip_gemini(transcript, target, baseline):
            analysis = baseline
            assessment_mode = "local_whisper_fast_path"
        else:
            try:
                analysis = analyze_with_gemini(transcript, target, baseline)
                assessment_mode = "local_whisper_plus_gemini_estimated"
            except Exception:
                analysis = baseline
                assessment_mode = "local_whisper_rule_based_fallback"

        return jsonify({
            "success": True,
            "assessment_mode": assessment_mode,
            "transcribed_text": transcript,
            "target_text": target,
            "score": analysis["metrics"]["overall"],
            "metrics": analysis["metrics"],
            "issues": analysis["issues"],
            "feedback_vi": analysis["feedback_vi"],
            "gemini_model": GEMINI_MODEL if gemini_client else None,
            "whisper_model": WHISPER_MODEL_SIZE,
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "transcription_failed",
            "message": str(error),
        }), 502

    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.unlink(temp_audio_path)
            except Exception:
                pass


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
