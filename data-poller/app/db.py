from typing import Optional

import redis
from flask import g, Flask

db_pool: Optional[redis.ConnectionPool] = None


def create_db() -> redis.Redis:
    """
    Get connection to the Redis-like database.

    :return: instance of Redis
    """
    return redis.Redis(connection_pool=db_pool)


def get_db() -> redis.Redis:
    """
    Get connection to the Redis-like database.

    :return: instance of Redis
    """
    if "db" not in g:
        g.db = create_db()
    return g.db


def close_db(e=None) -> None:
    """
    Close connection to the Redis in the context.
    """
    db: redis.Redis = g.pop("db", None)
    if db is not None:
        db.close()


def init_app(app: Flask) -> None:
    """
    Set up DB connection for Flask application automatically.

    :param app: Flask application instance
    """

    # Initialize database pool
    global db_pool
    if db_pool is None:
        db_pool = redis.ConnectionPool.from_url(app.config["DB_REDIS_URL"])

    # Mark connection as not used
    app.teardown_appcontext(close_db)
