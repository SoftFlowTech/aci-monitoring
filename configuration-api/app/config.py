from os import environ

# Redis connection URL, where metrics configuration is stored
DB_REDIS_URL = environ.get("DB_REDIS_URL")

# Configure logging level
LOG_LEVEL = environ.get("LOG_LEVEL") or "INFO"

# Validate
if not DB_REDIS_URL:
    raise EnvironmentError("Missing DB_REDIS_URL environment variable")
