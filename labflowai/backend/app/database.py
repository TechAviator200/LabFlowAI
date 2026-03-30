import logging
from app.config import settings

logger = logging.getLogger(__name__)

_client = None


def get_db():
    """Return the active database client.

    Falls back to an in-memory MockDB when:
      • USE_MOCK_DB=true is set, OR
      • SUPABASE_URL / SUPABASE_SERVICE_KEY are absent (safe for local demo).
    """
    global _client
    if _client is not None:
        return _client

    use_mock = (
        settings.use_mock_db
        or not settings.supabase_url
        or not settings.supabase_service_key
    )

    if use_mock:
        from app.mock_store import get_mock_db
        logger.info(
            "🧪  No Supabase credentials found — starting with in-memory mock database. "
            "Set SUPABASE_URL + SUPABASE_SERVICE_KEY in backend/.env for persistent storage."
        )
        _client = get_mock_db()
    else:
        from supabase import create_client
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
        logger.info("✅  Connected to Supabase at %s", settings.supabase_url)

    return _client
