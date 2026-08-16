import functools
import logging
import time

logger = logging.getLogger(__name__)


def traced_node(node_name: str):
    """Wraps a node function. Adds timing as a partial update (merged via the
    node_timings_ms reducer) rather than spreading the full state back -
    returning the whole state from every node causes LangGraph to see
    conflicting concurrent writes to unrelated keys when nodes run in
    parallel branches."""

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(state):
            start = time.perf_counter()
            try:
                result = fn(state)
                if result is None:
                    result = {}
            except Exception as exc:  # noqa: BLE001
                logger.exception("%s raised unhandled exception", node_name)
                result = {"errors": [f"{node_name}: {exc}"]}

            duration_ms = round((time.perf_counter() - start) * 1000, 1)
            result = dict(result)
            result["node_timings_ms"] = {node_name: duration_ms}

            logger.info("%s completed in %sms", node_name, duration_ms)
            return result

        return wrapper

    return decorator


def with_llm_retry(fn, max_retries: int = 2, backoff_seconds: float = 1.0):
    last_exc = None
    for attempt in range(max_retries + 1):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if attempt < max_retries:
                wait = backoff_seconds * (attempt + 1)
                logger.warning(
                    "LLM call failed (attempt %d/%d): %s — retrying in %.1fs",
                    attempt + 1, max_retries + 1, exc, wait,
                )
                time.sleep(wait)
    raise last_exc