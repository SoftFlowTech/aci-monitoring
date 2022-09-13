import os

from flask import Flask, request
from flask_cors import CORS

from .db import get_db, init_app as init_db
from .metrics import add_metric, get_metrics, delete_metric


def create_app(config=None):
    app = Flask(__name__)
    CORS(app)

    # Load configuration
    if config is None:
        app.config.from_pyfile("config.py")
    else:
        app.config.from_mapping(config)

    # Set logging level based on configuration
    app.logger.setLevel(app.config["LOG_LEVEL"])

    # Set up instance directory
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize dependencies
    init_db(app)

    @app.route("/meta/health")
    def route_health():
        """
        Endpoint to check components' health.

        :return: 204 when works fine, 500 when there are problems
        """
        get_db().ping()
        return "", 204

    @app.route("/metrics")
    def route_get_metrics():
        """
        Endpoint to get current metrics configuration.

        :return: 200 with metrics list, or 500 when there are problems
        """
        return get_metrics(get_db())

    @app.route("/metrics", methods=["POST"])
    def route_add_metric():
        """
        Add new metric to the configuration.

        :return: 200 with new metrics list, or 500 when there are problems
        """
        try:
            return add_metric(get_db(), request.json)
        except TypeError as e:
            return {"error": str(e)}, 400

    @app.route("/metrics/<metric_name>", methods=["DELETE"])
    def route_delete_metric(metric_name: str):
        """
        Delete metric from the metrics configuration.

        :param metric_name: unique metric name to delete from DB.
        :return: 200 with new metrics list, or 500 when there are problems
        """
        try:
            return delete_metric(get_db(), metric_name)
        except TypeError as e:
            return {"error": str(e)}, 400

    return app
