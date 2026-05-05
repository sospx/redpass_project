import hashlib
import httpx
import redis.asyncio as redis
import os
from zxcvbn import zxcvbn
from dotenv import load_dotenv

load_dotenv()
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)


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

    # Пытаемся получить данные из Redis кеш на 24 часа
    cache_key = f"leak:{sha1_hash}"
    cached_count = await redis_client.get(cache_key)
    if cached_count is not None:
        return int(cached_count)

    url = f"https://api.pwnedpasswords.com/range/{prefix}"
    headers = {"User-Agent": "Redpass-FastAPI-Project"}

    async with httpx.AsyncClient(headers=headers) as client:
        try:
            response = await client.get(url, timeout=5.0)
            if response.status_code != 200:
                return 0
        except httpx.RequestError:
            # Если сеть заблокирована, просто считаем, что утечек нет
            return 0

    hashes = (line.split(':') for line in response.text.splitlines())
    found_count = 0
    for h, count in hashes:
        if h == suffix:
            found_count = int(count)
            break

    # Сохраняем в кеш Redis на 1 сутки
    await redis_client.setex(cache_key, 86400, str(found_count))
    return found_count