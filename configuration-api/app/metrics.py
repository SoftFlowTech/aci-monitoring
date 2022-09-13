from typing import List
from json import loads, dumps
from re import match

import redis


def _validate_next_segment(query: str, offset: int) -> int:
    """
    Validate next query segment.

    :param query: query filter
    :param offset: index to start
    :return: index when ended successfully
    """
    part = query[offset:]

    # Detect regular function
    match_regular = match(
        r"^\s*((eq|le|lt|ge|gt|ne|wcard)\s*\(\s*[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*\s*,\s*\"([^\"]|\\\")*\"\s*\))\s*",  # noqa
        part,
    )
    if match_regular:
        return offset + len(match_regular.group(0))

    # Detect conditional function
    match_condition = match(r"\s*((and|or)\s*\()", part)
    if match_condition:
        # Check first argument
        offset += len(match_condition.group(0))
        offset = _validate_next_segment(query, offset)

        # Iterate over nested arguments 2...n
        while True:
            part = query[offset:]
            end_match = match(r"\s*\)\s*", part)
            if end_match:
                return offset + len(end_match.group(0))
            comma_match = match(r"\s*,", part)
            if not comma_match:
                break
            offset += len(comma_match.group(0))
            offset = _validate_next_segment(query, offset)
    raise TypeError("invalid query filter")


def validate_query_filter(query: str) -> None:
    """
    Validate query filter.

    :param query: query filter
    :raises: TypeError
    """
    if query == "":
        return
    if _validate_next_segment(query, 0) != len(query):
        raise TypeError("invalid query filter")


def validate_metric(metric: dict) -> None:
    """
    Validate metric schema.

    :param metric: Metric dictionary
    :raises Exception: when the dictionary is invalid
    """
    if not isinstance(metric, dict):
        raise TypeError("metric should be a dictionary")
    if set(metric.keys()) != {
        "name",
        "className",
        "attributes",
        "queryFilter",
        "interval",
    }:
        raise TypeError("invalid metric shape")

    name = metric.get("name")
    class_name = metric.get("className")
    attributes = metric.get("attributes")
    query_filter = metric.get("queryFilter")
    interval = metric.get("interval")
    if not isinstance(name, str) or not match(r"^[a-zA-Z0-9][a-zA-Z0-9_]*$", name):
        raise TypeError(
            "name can contain should start with letter or digit and may contain _"
        )
    if not isinstance(class_name, str) or len(class_name) == 0:
        raise TypeError("metric should have class name")
    if not isinstance(attributes, list) or any(
        x for x in attributes if not isinstance(x, str)
    ):
        raise TypeError("metric should have string attributes")
    if len(attributes) == 0:
        raise TypeError("metric should have at least one monitored attribute")
    if not isinstance(query_filter, str):
        raise TypeError("metric should have a query filter")
    if not isinstance(interval, int) or interval < 500:
        raise TypeError("metric should have interval >= 500")
    validate_query_filter(query_filter)


def get_metrics(db: redis.Redis) -> List[dict]:
    """
    Get monitored items from Redis.

    :param db: Redis instance
    :return: list of metrics from database
    """
    return loads(db.get("metrics") or "[]")


def set_metrics(db: redis.Redis, metrics: List[dict]) -> List[dict]:
    """
    Replace monitored items list in Redis.

    :param db: Redis instance
    :param metrics: New list of metrics
    :return: list of metrics from database
    """
    db.set("metrics", dumps(metrics))
    return metrics


def delete_metric(db: redis.Redis, name: str) -> List[dict]:
    """
    Delete single monitored item from Redis.

    :param db: Redis instance
    :param name: Name of metric to delete
    :return: list of metrics from database
    """
    metrics = [x for x in get_metrics(db) if x["name"] != name]
    set_metrics(db, metrics)
    return metrics


def add_metric(db: redis.Redis, metric: dict) -> List[dict]:
    """
    Add new monitored item to Redis.

    :param db: Redis instance
    :param metric: Valid metric with unique name
    :return: list of metrics from database
    """
    validate_metric(metric)
    metrics = get_metrics(db)
    if any(x for x in metrics if x["name"] == metric["name"]):
        raise TypeError("metric with that name already exists")
    set_metrics(db, metrics + [metric])
    return metrics + [metric]
