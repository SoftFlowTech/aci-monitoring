FROM python:3.9-alpine as base

FROM base as deps

# Install tools to build dependencies
RUN apk add gcc musl-dev

# Install pipenv
RUN pip install pipenv

# Install dependencies
COPY Pipfile .
COPY Pipfile.lock .
RUN PIPENV_VENV_IN_PROJECT=1 pipenv install --deploy

FROM base

# Don't buffer logs
ENV PYTHONUNBUFFERED=TRUE

# Copy dependencies
COPY --from=deps /.venv /.venv
ENV PATH="/.venv/bin:$PATH"

# Use new user to avoid root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /home/app
USER appuser

# Copy application
COPY . .

# Expose ports
EXPOSE 8080

# Verify health
HEALTHCHECK --interval=5s --timeout=1s \
  CMD wget "http://localhost:8080/meta/health" -q -O - || exit 1

# Run
CMD ["gunicorn", "-b", "0.0.0.0:8080", "--access-logfile=-", "--error-logfile=-", "app:create_app()"]
