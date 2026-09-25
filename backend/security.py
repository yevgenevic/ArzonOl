"""Small, bounded rate limiter for a single-process demo deployment."""
from collections import OrderedDict
from threading import Lock
from time import monotonic


class RateLimiter:
    def __init__(self, limit, window, max_keys=10000):
        self.limit, self.window, self.max_keys = limit, window, max_keys
        self.hits = OrderedDict()
        self.lock = Lock()

    def limited(self, key):
        now = monotonic()
        with self.lock:
            # Entries are ordered by last request; expire inactive clients.
            while self.hits:
                oldest = next(iter(self.hits))
                if now - self.hits[oldest][-1] < self.window:
                    break
                self.hits.popitem(last=False)
            hits = [t for t in self.hits.get(key, []) if now - t < self.window]
            if len(hits) >= self.limit:
                return True
            if key not in self.hits and len(self.hits) >= self.max_keys:
                return True
            hits.append(now)
            self.hits[key] = hits
            self.hits.move_to_end(key)
            return False


auth_limiter = RateLimiter(20, 600)
analytics_limiter = RateLimiter(120, 60)
