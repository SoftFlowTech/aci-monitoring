import pytest

from .. import create_app


@pytest.fixture()
def app():
    config = {
        "LOG_LEVEL": "INFO",
        "DB_REDIS_URL": "redis://test-redis-url",
    }
    app = create_app(config, lambda: None)
    return app
