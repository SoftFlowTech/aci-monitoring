import os
from threading import Thread

from flask import Flask

from .db import get_db, init_app as init_db


def create_app(config=None, process_func=None):
    app = Flask(__name__)

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

    # Start processing task
    if not process_func:
        from .poller import process

        process_func = process
    process_thread = Thread(target=process_func)
    process_thread.start()

    @app.route("/meta/health")
    def route_health():
        """
        Endpoint to check components' health.

        :return: 204 when works fine, 500 when there are problems
        """
        get_db().ping()
        return "", 204

    return app
