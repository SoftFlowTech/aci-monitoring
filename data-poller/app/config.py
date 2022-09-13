from os import environ

# Redis connection URL, where metrics configuration is stored
DB_REDIS_URL = environ.get("DB_REDIS_URL") or ""

# Configure logging level
LOG_LEVEL = environ.get("LOG_LEVEL") or "INFO"

# Configure Prometheus Push Gateway
PROMETHEUS_PUSHGATEWAY_URL = environ.get("PROMETHEUS_PUSHGATEWAY_URL") or ""

# Configure ACI
ACI_URL = environ.get("ACI_URL") or ""
ACI_USERNAME = environ.get("ACI_USERNAME") or ""
ACI_PASSWORD = environ.get("ACI_PASSWORD") or ""

# Validate
if not DB_REDIS_URL:
    raise EnvironmentError("Missing DB_REDIS_URL environment variable")
if not ACI_URL or not ACI_USERNAME or not ACI_PASSWORD:
    raise EnvironmentError("Missing ACI_* environment variables")
if not PROMETHEUS_PUSHGATEWAY_URL:
    raise EnvironmentError("Missing PROMETHEUS_PUSHGATEWAY_URL environment variable")
