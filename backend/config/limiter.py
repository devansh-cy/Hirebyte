import logging
from fastapi import Request

try:
    from slowapi import Limiter
    HAS_RATE_LIMITER = True
except ImportError:
    HAS_RATE_LIMITER = False

logger = logging.getLogger("hirebyte")

def get_trusted_client_ip(request: Request) -> str:
    """Resolve original client IP, bypassing load-balancer/proxy IPs."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

if HAS_RATE_LIMITER:
    limiter = Limiter(key_func=get_trusted_client_ip)
else:
    class MockLimiter:
        def limit(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
    limiter = MockLimiter()
