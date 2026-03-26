import hashlib
import httpx
from zxcvbn import zxcvbn


def mask_password(password: str) -> str:
    if len(password) <= 2:
        return "*" * len(password)
    return f"{password[0]}{'*' * (len(password) - 2)}{password[-1]}"


def analyze_strength(password: str) -> dict:
    results = zxcvbn(password)
    return {
        "score": results["score"],
        "crack_time": results["crack_times_display"]["offline_slow_hashing_1e4_per_second"]
    }


async def check_leaks(password: str) -> int:
    sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]

    url = f"https://api.pwnedpasswords.com/range/{prefix}"
    headers = {"User-Agent": "Redpass-FastAPI-Project"}

    async with httpx.AsyncClient(headers=headers) as client:
        try:
            response = await client.get(url, timeout=10.0)
            print(f"Ответ от HIBP: {response.status_code}")
            if response.status_code != 200:
                print(f"⚠️ Ошибка сервера HIBP: {response.text}")
                return 0
        except httpx.RequestError as exc:
            print(f"🚫 Ошибка сети (возможно нужна VPN): {exc}")
            return 0

    hashes = (line.split(':') for line in response.text.splitlines())
    for h, count in hashes:
        if h == suffix:
            return int(count)
    return 0
