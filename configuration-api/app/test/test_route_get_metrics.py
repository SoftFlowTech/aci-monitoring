from typing import List
from unittest.mock import patch, MagicMock
from json import dumps

from flask.testing import FlaskClient


@patch("redis.Redis")
def test_route_get_metrics_none(mock_redis: MagicMock, client: FlaskClient):
    mock_redis.return_value.get.return_value = None
    response = client.get("/metrics")
    assert response.status_code == 200
    assert response.json == []


@patch("redis.Redis")
def test_route_get_metrics_empty(mock_redis: MagicMock, client: FlaskClient):
    mock_redis.return_value.get.return_value = "[]"
    response = client.get("/metrics")
    assert response.status_code == 200
    assert response.json == []


@patch("redis.Redis")
def test_route_get_metrics_multiple(
    mock_redis: MagicMock, client: FlaskClient, metrics: List[dict]
):
    mock_redis.return_value.get.return_value = dumps(metrics)
    response = client.get("/metrics")
    assert response.status_code == 200
    assert response.json == metrics


@patch(
    "redis.Redis",
    **{
        "return_value.get.side_effect": Exception(),
    }
)
def test_route_get_metrics_get_error(mock_redis: MagicMock, client: FlaskClient):
    assert client.get("/metrics").status_code == 500
