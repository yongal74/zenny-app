"""
Zenny AI 콘텐츠 자동 생성 스크립트
매주 새로운 명상 보이스(ElevenLabs) + 음악(Suno AI) 2개씩 생성
"""
import os
import httpx
import asyncio
from datetime import datetime
from pathlib import Path
import json

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
SUNO_API_KEY = os.getenv("SUNO_API_KEY", "")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "zenny-meditation-tracks")

# ElevenLabs 보이스 ID
VOICES = {
    "en_hana": "pNInz6obpgDQGcFmaJgB",   # Calm female EN
    "en_sora": "ErXwobaYiN019PkySvjV",    # Thoughtful male EN
    "ko_hana": "9BWtsMINqrJLrRacOk9x",    # Warm female KO
}

# ─── 명상 스크립트 템플릿 ─────────────────────────────────────
SCRIPTS_EN = {
    "breathing": """
Welcome. Take a comfortable seat and gently close your eyes.
Let's begin with a simple box breath together.
Breathe in slowly... 2... 3... 4.
Hold gently... 2... 3... 4.
Now breathe out... 2... 3... 4.
Hold again... 2... 3... 4.
Notice how your nervous system begins to settle.
Each breath activates your parasympathetic response, signaling safety to every cell.
One more round. Breathe in... hold... breathe out... hold.
Beautiful. You are here. You are safe.
""",
    "bodyscan": """
Find a comfortable position. Allow your body to fully relax.
Begin with your feet. Notice any sensation there... warmth, pressure, tingling.
Simply observe without judgment — this is mindfulness in its purest form.
Moving up to your calves... your knees... your thighs.
Your Default Mode Network is quieting now. Thoughts slow. Presence grows.
Continuing to your stomach... your chest. Feel it rise and fall with each breath.
Your shoulders... arms... hands. Let them be heavy and warm.
Finally, your face. Relax your jaw. Soften your eyes.
You are fully present. Completely at peace.
""",
}

SCRIPTS_KO = {
    "breathing": """
편안하게 앉아 부드럽게 눈을 감으세요.
함께 박스 호흡을 시작해볼게요.
천천히 숨을 들이쉬세요... 2... 3... 4.
부드럽게 멈추세요... 2... 3... 4.
이제 내쉬세요... 2... 3... 4.
다시 멈추세요... 2... 3... 4.
신경계가 안정되는 것을 느껴보세요.
매 호흡이 부교감신경을 활성화하여 몸 전체에 안전 신호를 보냅니다.
한 번 더 해볼게요. 들이쉬고... 멈추고... 내쉬고... 멈추고.
아름다워요. 당신은 지금 여기에 있어요. 안전합니다.
""",
    "bodyscan": """
편안한 자세를 찾아보세요. 몸이 완전히 이완되도록 허용하세요.
발부터 시작합니다. 발에서 느껴지는 감각을 알아채세요... 따뜻함, 압력, 따끔함.
판단 없이 그저 관찰하세요 — 이것이 순수한 마음챙김입니다.
종아리... 무릎... 허벅지로 올라가요.
디폴트 모드 네트워크가 조용해지고 있어요. 생각이 느려지고, 현재 순간의 인식이 커져요.
배... 가슴으로 이어집니다. 호흡과 함께 오르내림을 느껴보세요.
어깨... 팔... 손. 무겁고 따뜻하게 내려놓으세요.
마지막으로 얼굴. 턱의 힘을 빼세요. 눈 주위 근육을 부드럽게 하세요.
완전히 현재에 있습니다. 완전한 평화입니다.
""",
}


async def generate_voice_track(
    script: str,
    voice_id: str,
    lang: str,
    track_type: str,
    week: str,
    client: httpx.AsyncClient,
) -> bytes | None:
    """ElevenLabs TTS API로 음성 생성"""
    if not ELEVENLABS_API_KEY:
        print(f"[SKIP] ElevenLabs API key not set — skipping voice generation")
        return None

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": script.strip(),
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.65,
            "similarity_boost": 0.85,
            "style": 0.15,
            "use_speaker_boost": True,
        },
    }
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        response = await client.post(url, json=payload, headers=headers, timeout=60.0)
        response.raise_for_status()
        print(f"✅ 음성 생성 완료: {lang}_{track_type}_{week}")
        return response.content
    except Exception as e:
        print(f"❌ 음성 생성 실패: {e}")
        return None


def save_track_locally(audio_bytes: bytes, lang: str, track_type: str, week: str) -> Path:
    """로컬에 저장 (S3 업로드 전 임시)"""
    out_dir = Path("generated_tracks") / lang / week
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{track_type}_{week}.mp3"
    path.write_bytes(audio_bytes)
    print(f"💾 저장: {path}")
    return path


async def upload_to_s3(local_path: Path, s3_key: str) -> str:
    """AWS S3 업로드 (boto3 필요)"""
    try:
        import boto3
        s3 = boto3.client("s3")
        s3.upload_file(
            str(local_path), AWS_S3_BUCKET, s3_key,
            ExtraArgs={"ContentType": "audio/mpeg", "ACL": "public-read"},
        )
        url = f"https://{AWS_S3_BUCKET}.s3.amazonaws.com/{s3_key}"
        print(f"☁️ S3 업로드 완료: {url}")
        return url
    except Exception as e:
        print(f"❌ S3 업로드 실패: {e}")
        return ""


async def generate_weekly_tracks():
    """주간 명상 트랙 자동 생성 메인 함수"""
    week = datetime.now().strftime("W%W")
    year = datetime.now().year
    week_label = f"{year}-{week}"

    print(f"\n🎙️ Zenny 주간 트랙 생성 시작: {week_label}")
    print("=" * 50)

    generated = []

    async with httpx.AsyncClient() as client:
        tasks = []

        # EN: breathing + bodyscan
        for track_type in ["breathing", "bodyscan"]:
            script = SCRIPTS_EN.get(track_type, "")
            if script:
                tasks.append((
                    generate_voice_track(script, VOICES["en_hana"], "en", track_type, week_label, client),
                    "en", track_type,
                ))

        # KO: breathing + bodyscan
        for track_type in ["breathing", "bodyscan"]:
            script = SCRIPTS_KO.get(track_type, "")
            if script:
                tasks.append((
                    generate_voice_track(script, VOICES["ko_hana"], "ko", track_type, week_label, client),
                    "ko", track_type,
                ))

        # 병렬 실행
        results = await asyncio.gather(*[t[0] for t in tasks])

        for (_, lang, track_type), audio_bytes in zip(tasks, results):
            if audio_bytes:
                local_path = save_track_locally(audio_bytes, lang, track_type, week_label)
                s3_key = f"tracks/{lang}/{track_type}_{week_label}.mp3"
                url = await upload_to_s3(local_path, s3_key)
                generated.append({
                    "lang": lang, "type": track_type, "week": week_label,
                    "url": url, "local": str(local_path),
                })

    # 생성 결과 저장
    report_path = Path("generated_tracks") / f"report_{week_label}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(generated, indent=2, ensure_ascii=False))

    print(f"\n✅ 주간 트랙 생성 완료: {len(generated)}개")
    print(f"📋 리포트: {report_path}")
    return generated


if __name__ == "__main__":
    asyncio.run(generate_weekly_tracks())
