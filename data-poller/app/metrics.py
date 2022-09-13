import time
from typing import List, Set
from json import loads, dumps

import redis


def get_processed_key(name: str) -> str:
    return f"processed-{name}"


def get_related_ids_key(name: str) -> str:
    return f"mos-{name}"


def get_metrics(db: redis.Redis) -> List[dict]:
    """
    Get monitored items from Redis.

    :param db: Redis instance
    :return: list of metrics from database
    """
    return loads(db.get("metrics") or "[]")


def get_last_processing_time(db: redis.Redis, names: List[str]) -> dict:
    """
    Get last time the metrics has been processed.

    :param db: Redis instance
    :param names: list of metrics names to load
    :return: dictionary of <metric name, time when it was processed last time>
    """
    results = db.mget([get_processed_key(name) for name in names])
    return dict(zip(names, [int(x or 0) for x in results]))


def mark_as_processed(db: redis.Redis, name: str) -> None:
    """
    Mark a metric as just processed.

    :param db: Redis instance
    :param name: metric name
    """
    db.set(get_processed_key(name), int(time.time() * 1000))


def get_processed_metric_names(db: redis.Redis) -> Set[str]:
    """
    Get list of metric names that has been processed.

    :param db: Redis instance
    :return: list of processed metric names
    """
    keys = db.keys(get_processed_key("*"))
    prefix_length = len(get_processed_key("name")) - 4
    return set([key[prefix_length:].decode("utf-8") for key in keys])


def delete_metric_data(db: redis.Redis, name: str) -> None:
    """
    Clears information about metric.
    Used to remove obsolete data.

    :param db: Redis instance
    :param name: metric name
    """
    db.delete(get_processed_key(name))
    db.delete(get_related_ids_key(name))


def get_metric_related_ids(db: redis.Redis, name: str) -> Set[str]:
    """
    Get list of gauge IDs related to the metric.

    :param db: Redis instance
    :param name: metric name
    :return: list of IDs
    """
    return set(loads(db.get(get_related_ids_key(name)) or "[]"))


def save_metric_related_ids(db: redis.Redis, name: str, related_ids: Set[str]) -> None:
    """
    Save list of IDs related to the metric.

    :param db: Redis instance
    :param name: metric name
    :param related_ids: DNs of related MOs
    """
    db.set(get_related_ids_key(name), dumps(list(related_ids)))
