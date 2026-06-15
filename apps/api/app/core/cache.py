"""Simple in-memory cache for performance."""

from datetime import datetime, timedelta
from typing import Any


class SimpleCache:
    """Simple TTL cache."""
    
    def __init__(self):
        self._cache: dict[str, tuple[Any, datetime]] = {}
    
    def get(self, key: str) -> Any | None:
        if key in self._cache:
            value, expires = self._cache[key]
            if datetime.now() < expires:
                return value
            del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        self._cache[key] = (value, datetime.now() + timedelta(seconds=ttl_seconds))
    
    def delete(self, key: str):
        self._cache.pop(key, None)
    
    def clear(self):
        self._cache.clear()


cache = SimpleCache()
