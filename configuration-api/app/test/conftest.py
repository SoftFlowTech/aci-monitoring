import pytest

from .. import create_app


@pytest.fixture()
def app():
    config = {
        "LOG_LEVEL": "INFO",
        "DB_REDIS_URL": "redis://test-redis-url",
    }
    app = create_app(config)
    return app


@pytest.fixture()
def metrics():
    return [
        {
            "name": "metric_1",
            "className": "metric_class_name_1",
            "attributes": ["attribute1", "attribute2"],
            "queryFilter": 'eq(metric_class_name_1.attribute3, "10")',
            "interval": 1234,
        },
        {
            "name": "metric_2",
            "className": "metric_class_name_2",
            "attributes": ["attribute4", "attribute5"],
            "queryFilter": 'eq(metric_class_name_2.attribute6, "10")',
            "interval": 4321,
        },
    ]
