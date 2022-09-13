from typing import List
from unittest.mock import patch, MagicMock
from json import dumps

from flask.testing import FlaskClient


@patch(
    "redis.Redis",
    **{
        "return_value.get.side_effect": Exception(),
    },
)
def test_route_delete_metric_redis_get_error(
    mock_redis: MagicMock, client: FlaskClient, metrics: List[dict]
):
    response = client.delete(f"/metrics/{metrics[0]['name']}")
    assert response.status_code == 500


@patch(
    "redis.Redis",
    **{
        "return_value.set.side_effect": Exception(),
    },
)
def test_route_delete_metric_redis_set_error(
    mock_redis: MagicMock, client: FlaskClient, metrics: List[dict]
):
    mock_redis.return_value.get.return_value = dumps(metrics)
    response = client.delete(f"/metrics/{metrics[0]['name']}")
    assert response.status_code == 500


@patch("redis.Redis")
def test_route_delete_metric_unknown(
    mock_redis: MagicMock, client: FlaskClient, metrics: List[dict]
):
    mock_redis.return_value.get.return_value = dumps([metrics[0]])
    response = client.delete(f"/metrics/{metrics[1]['name']}")
    assert response.status_code == 200
    assert response.json == [metrics[0]]


@patch("redis.Redis")
def test_route_delete_metric(
    mock_redis: MagicMock, client: FlaskClient, metrics: List[dict]
):
    mock_redis.return_value.get.return_value = dumps(metrics)
    response = client.delete(f"/metrics/{metrics[0]['name']}")
    assert response.status_code == 200
    assert response.json == [metrics[1]]
