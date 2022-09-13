import logging
import hashlib
import re
from threading import Thread
from typing import List
import time

from acitoolkit import Session  # type: ignore
import redis
from prometheus_client import (
    CollectorRegistry,
    Gauge,
    push_to_gateway,
    delete_from_gateway,
)

from ..aci import get_aci_session, aci_query
from ..db import create_db
from ..metrics import (
    get_metrics,
    get_last_processing_time,
    mark_as_processed,
    get_processed_metric_names,
    get_metric_related_ids,
    save_metric_related_ids,
    delete_metric_data,
)
from ..config import (
    ACI_URL,
    ACI_PASSWORD,
    ACI_USERNAME,
    LOG_LEVEL,
    PROMETHEUS_PUSHGATEWAY_URL,
)


# Configure
logger = logging.getLogger("gunicorn.error")
logger.setLevel(LOG_LEVEL)
config = {
    "url": ACI_URL,
    "username": ACI_USERNAME,
    "password": ACI_PASSWORD,
}


def hash_metric(name: str, dn: str, attribute: str) -> str:
    result = hashlib.md5(f"{name}-{dn}-{attribute}".encode("utf-8")).hexdigest()
    return result


def sanitize_name(name: str) -> str:
    if re.match(r"^[^a-zA-Z_]", name):
        name = f"X_{name}"
    return re.sub(r"[^a-zA-Z0-9_]+", "_", name)


def format_dn(class_name: str, dn: str) -> str:
    return dn[0 : -1 * len(class_name)] if dn.endswith(class_name) else dn


def send_metric(name: str, class_name: str, dn: str, attribute: str, value: float):
    formatted_dn = format_dn(class_name, dn)
    registry = CollectorRegistry()
    gauge = Gauge(
        sanitize_name(name), "", labelnames=("dn", "attribute_name"), registry=registry
    )
    gauge.labels(formatted_dn, attribute).set(value)
    logger.debug(f"sending {name}/{attribute} metric to PushGateway")
    push_to_gateway(
        PROMETHEUS_PUSHGATEWAY_URL,
        job="aci_monitoring",
        grouping_key={"id": hash_metric(name, dn, attribute)},
        registry=registry,
    )


def delete_metric_by_id(related_id: str):
    delete_from_gateway(
        PROMETHEUS_PUSHGATEWAY_URL,
        job="aci_monitoring",
        grouping_key={"id": related_id},
    )


def delete_metric(db: redis.Redis, name: str):
    related_ids = get_metric_related_ids(db, name)
    for related_id in related_ids:
        delete_metric_by_id(related_id)


def delete_all_metrics():
    delete_from_gateway(PROMETHEUS_PUSHGATEWAY_URL, job="aci_monitoring")


def process_metric(db: redis.Redis, session: Session, metric: dict) -> None:
    # Load data
    name: str = metric["name"]
    class_name: str = metric["className"]
    query_filter: str = metric["queryFilter"]
    attributes: List[str] = metric["attributes"]

    # Get all matching items from ACI
    try:
        logger.debug(
            "loading ACI data",
            {"name": name, "class_name": class_name, "query_filter": query_filter},
        )
        items = aci_query(session, class_name, query_filter)
        mos = set([item[class_name]["attributes"]["dn"] for item in items])
    except Exception as e:
        logger.error(
            f"error querying ACI: ${e}",
            {"name": name, "class_name": class_name, "query_filter": query_filter},
        )
        try:
            delete_metric(db, name)
        except Exception as e:
            logger.error(f"error deleting '{name}' metric: {e}", {"name": name})
        return

    # Iterate over every item
    try:
        for item in items:
            data = item[class_name]["attributes"]
            dn = data["dn"]
            for attribute in attributes:
                send_metric(name, class_name, dn, attribute, data[attribute])
    except Exception as e:
        logger.error(f"error sending '{name}' metric: {e}", {"name": name})
        try:
            delete_metric(db, name)
        except Exception as e:
            logger.error(f"error deleting '{name}' metric: {e}", {"name": name})
        return

    # Save information that it has been just processed
    try:
        mark_as_processed(db, name)
    except Exception as e:
        logger.error(f"error marking '{name}' metric as processed: {e}")

    # Delete metrics for obsolete MOs
    try:
        previous_related_ids = get_metric_related_ids(db, name)
        current_related_ids = set()
        for dn in mos:
            for attribute in attributes:
                current_related_ids.add(hash_metric(name, dn, attribute))
        obsolete_related_ids = previous_related_ids - current_related_ids
        logger.debug(
            f"deleting {len(obsolete_related_ids)} obsolete entries for {name}"
        )
        for related_id in obsolete_related_ids:
            delete_metric_by_id(related_id)
    except Exception as e:
        logger.error(f"error deleting obsolete entries for {name}: {e}")

    # Save information about recent MOs
    try:
        if previous_related_ids != current_related_ids:
            save_metric_related_ids(db, name, current_related_ids)
    except Exception as e:
        logger.error(f"error saving related IDs for {name} metric: {e}")


def process():
    db = create_db()

    # Obtain APIC session - retry after minimum second
    session = None
    while session is None:
        try:
            session = get_aci_session(config)
        except Exception as e:
            logger.error(f"error obtaining APIC session: {e}")
            time.sleep(1)

    # Processing loop
    while True:
        # Wait a moment to avoid immediate operations
        time.sleep(0.5)

        # Load recent configuration and last processing time
        metrics = get_metrics(db)
        names = [metric["name"] for metric in metrics]
        processed_at = get_last_processing_time(db, names)

        # Detect metrics that needs processing, and do it
        now_ms = time.time() * 1000
        threads = [
            Thread(target=process_metric, args=(db, session, metric))
            for metric in metrics
            if processed_at[metric["name"]] + metric["interval"] < now_ms
        ]
        for x in threads:
            x.start()
        for x in threads:
            x.join()

        # Delete obsolete metrics
        try:
            processed_metric_names = set(get_processed_metric_names(db))
            active_metric_names = set([metric["name"] for metric in metrics])
            obsolete_metric_names = processed_metric_names - active_metric_names
            for name in obsolete_metric_names:
                logger.debug(f"deleting obsolete metric: {name}")
                delete_metric(db, name)
                delete_metric_data(db, name)
        except Exception as e:
            logger.error(f"error detecting/deleting obsolete metrics: {e}")
