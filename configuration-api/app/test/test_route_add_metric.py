from typing import List, Optional
from unittest.mock import patch, MagicMock
from json import dumps

from flask.testing import FlaskClient
import pytest


@patch(
    "redis.Redis",
    **{
        "return_value.get.side_effect": Exception(),
    }
)
def test_route_add_metric_redis_get_error(
    mock_redis: MagicMock, client: FlaskClient, metrics: List[dict]
):
    response = client.post("/metrics", json=metrics[0])
    assert response.status_code == 500


@patch(
    "redis.Redis",
    **{
        "return_value.set.side_effect": Exception(),
    }
)
def test_route_add_metric_redis_set_error(
    mock_redis: MagicMock, client: FlaskClient, metrics: List[dict]
):
    mock_redis.return_value.get.return_value = dumps([metrics[0]])
    response = client.post("/metrics", json=metrics[1])
    assert response.status_code == 500


@patch("redis.Redis")
def test_route_add_metric_duplicate(
    mock_redis: MagicMock, client: FlaskClient, metrics: List[dict]
):
    mock_redis.return_value.get.return_value = dumps(metrics)
    response = client.post("/metrics", json=metrics[0])
    assert response.status_code == 400
    assert response.json["error"] == "metric with that name already exists"


@pytest.mark.parametrize(
    "name",
    [
        "$&#*akdod",
        "_name",
        "",
        {},
        123,
        None,
    ],
)
@patch("redis.Redis")
def test_route_add_metric_invalid_name(
    mock_redis: MagicMock, client: FlaskClient, metrics: List[dict], name: Optional[str]
):
    mock_redis.return_value.get.return_value = dumps([metrics[0]])
    response = client.post("/metrics", json=metrics[1] | {"name": name})
    assert response.status_code == 400
    assert (
        response.json["error"]
        == "name can contain should start with letter or digit and may contain _"
    )


@pytest.mark.parametrize(
    "class_name",
    [
        "",
        {},
        123,
        None,
    ],
)
@patch("redis.Redis")
def test_route_add_metric_invalid_class_name(
    mock_redis: MagicMock,
    client: FlaskClient,
    metrics: List[dict],
    class_name: Optional[str],
):
    mock_redis.return_value.get.return_value = dumps([metrics[0]])
    response = client.post("/metrics", json=metrics[1] | {"className": class_name})
    assert response.status_code == 400
    assert response.json["error"] == "metric should have class name"


@pytest.mark.parametrize(
    "attributes",
    [
        ["sss", 13],
        "name",
        {},
        123,
        None,
    ],
)
@patch("redis.Redis")
def test_route_add_metric_invalid_attributes(
    mock_redis: MagicMock,
    client: FlaskClient,
    metrics: List[dict],
    attributes: Optional[str],
):
    mock_redis.return_value.get.return_value = dumps([metrics[0]])
    response = client.post("/metrics", json=metrics[1] | {"attributes": attributes})
    assert response.status_code == 400
    assert response.json["error"] == "metric should have string attributes"


@patch("redis.Redis")
def test_route_add_metric_empty_attributes(
    mock_redis: MagicMock, client: FlaskClient, metrics: List[dict]
):
    mock_redis.return_value.get.return_value = dumps([metrics[0]])
    response = client.post("/metrics", json=metrics[1] | {"attributes": []})
    assert response.status_code == 400
    assert (
        response.json["error"] == "metric should have at least one monitored attribute"
    )


@pytest.mark.parametrize("query_filter", [[""], None, {}, 123])
@patch("redis.Redis")
def test_route_add_metric_invalid_query_filter_type(
    mock_redis: MagicMock,
    client: FlaskClient,
    metrics: List[dict],
    query_filter: Optional[str],
):
    mock_redis.return_value.get.return_value = dumps([metrics[0]])
    response = client.post("/metrics", json=metrics[1] | {"queryFilter": query_filter})
    assert response.status_code == 400
    assert response.json["error"] == "metric should have a query filter"


@pytest.mark.parametrize(
    "query_filter",
    [
        "abc.def",
        'eq("12", 12)',
        'ew("12", 12)',
        'and("10")',
        'and(ew(15, "15"))',
    ],
)
@patch("redis.Redis")
def test_route_add_metric_invalid_query_filter(
    mock_redis: MagicMock,
    client: FlaskClient,
    metrics: List[dict],
    query_filter: Optional[str],
):
    mock_redis.return_value.get.return_value = dumps([metrics[0]])
    response = client.post("/metrics", json=metrics[1] | {"queryFilter": query_filter})
    assert response.status_code == 400
    assert response.json["error"] == "invalid query filter"


@pytest.mark.parametrize(
    "query_filter",
    [
        'eq(abc.def, "12")',
        'gt(abc.def, "12")',
        'lt(abc.def, "12")',
        'le(abc.def, "12")',
        'ge(abc.def, "12")',
        'ne(abc.def, "12")',
        'wcard(abc.def, "12")',
        'and(wcard(abc.def, "12"))',
        'and(wcard(abc.def, "12"), eq(abc.xyz, "15"))',
        'or(wcard(abc.def, "12"), eq(abc.xyz, "15"))',
        'or(wcard(abc.def,"12"),eq(abc.xyz,"15"),ne(abc.ncd,"15"))',
    ],
)
@patch("redis.Redis")
def test_route_add_metric_valid_query_filter(
    mock_redis: MagicMock,
    client: FlaskClient,
    metrics: List[dict],
    query_filter: Optional[str],
):
    mock_redis.return_value.get.return_value = dumps([metrics[0]])
    response = client.post("/metrics", json=metrics[1] | {"queryFilter": query_filter})
    assert response.status_code == 200
