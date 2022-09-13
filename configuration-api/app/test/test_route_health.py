from unittest.mock import patch, MagicMock

from flask.testing import FlaskClient


@patch("redis.Redis")
def test_health_redis_connected(mock_redis: MagicMock, client: FlaskClient):
    assert client.get("/meta/health").status_code == 204
    assert mock_redis.return_value.ping.called


@patch(
    "redis.Redis",
    **{
        "return_value.ping.side_effect": Exception(),
    }
)
def test_health_redis_disconnected(mock_redis: MagicMock, client: FlaskClient):
    assert client.get("/meta/health").status_code == 500
