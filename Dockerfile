# CellProof: re-run every table from the cached model outputs. No API call, no key, no cost.
#   docker build -t cellproof .
#   docker run --rm cellproof            # = `make verify`
#   docker run --rm cellproof pytest -m "not live"
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

# dependencies first, so that a change in the code does not reinstall them (pinned in pyproject.toml)
COPY pyproject.toml ./
RUN mkdir -p src/cellproof && touch src/cellproof/__init__.py && pip install -e ".[dev]"

COPY . .
RUN pip install -e . --no-deps

CMD ["python", "-m", "cellproof.cli", "verify"]
