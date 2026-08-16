"""
Thin wrapper around the Groq SDK.
"""
import json
import logging
import time

from groq import Groq, APIStatusError, APIConnectionError, APITimeoutError

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Groq | None = None

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def get_groq_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY, timeout=settings.GROQ_REQUEST_TIMEOUT_SECONDS)
    return _client


def _strip_json_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.lower().startswith("json"):
            text = text[4:]
    return text.strip()


def _is_retryable(exc: Exception) -> bool:
    if isinstance(exc, (APIConnectionError, APITimeoutError)):
        return True
    if isinstance(exc, APIStatusError):
        return exc.status_code in RETRYABLE_STATUS_CODES
    return False


def _log_usage(response, model: str) -> None:
    usage = getattr(response, "usage", None)
    if usage:
        logger.info(
            "Groq call model=%s prompt_tokens=%s completion_tokens=%s total_tokens=%s",
            model,
            getattr(usage, "prompt_tokens", "?"),
            getattr(usage, "completion_tokens", "?"),
            getattr(usage, "total_tokens", "?"),
        )


def _chat_completion(system_prompt, user_prompt, model, temperature, json_mode, max_retries):
    client = get_groq_client()
    last_exc: Exception | None = None

    for attempt in range(max_retries + 1):
        try:
            kwargs = {}
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            response = client.chat.completions.create(
                model=model,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                **kwargs,
            )
            _log_usage(response, model)
            return response.choices[0].message.content
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            if attempt < max_retries and _is_retryable(exc):
                wait = 2 ** attempt
                logger.warning(
                    "Groq call failed (model=%s, attempt %d/%d): %s — retrying in %ds",
                    model, attempt + 1, max_retries + 1, exc, wait,
                )
                time.sleep(wait)
                continue
            raise
    raise last_exc  # pragma: no cover


def call_llm_json(system_prompt, user_prompt, model=None, temperature=0.1, fallback_model=None) -> dict:
    model = model or settings.GROQ_EXTRACTION_MODEL
    try:
        raw = _chat_completion(
            system_prompt, user_prompt, model, temperature, json_mode=True,
            max_retries=settings.GROQ_MAX_RETRIES,
        )
    except Exception as primary_exc:  # noqa: BLE001
        if fallback_model and fallback_model != model:
            logger.warning("Primary model %s failed (%s), falling back to %s", model, primary_exc, fallback_model)
            raw = _chat_completion(
                system_prompt, user_prompt, fallback_model, temperature, json_mode=True, max_retries=1,
            )
        else:
            raise

    try:
        return json.loads(_strip_json_fences(raw))
    except json.JSONDecodeError:
        logger.warning("LLM JSON parse failed, raw output: %s", raw[:500])
        return {}


def call_llm_text(system_prompt, user_prompt, model=None, temperature=0.3) -> str:
    model = model or settings.GROQ_REASONING_MODEL
    raw = _chat_completion(
        system_prompt, user_prompt, model, temperature, json_mode=False,
        max_retries=settings.GROQ_MAX_RETRIES,
    )
    return raw.strip()