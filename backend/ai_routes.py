"""ai routes for the demo application."""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Literal
from db import get_db
import ai
from dependencies import current_user, ensure_product, require_user
from schemas import BundleIn, ChatIn, CompareVerdictIn

router = APIRouter()

@router.get("/api/ai/status")
def ai_status():
    """Фронтенд узнаёт, включён ли AI, чтобы не показывать виджет впустую."""
    return {"enabled": ai.is_configured(), "model": ai.model_name()}


@router.post("/api/ai/chat")
def ai_chat(body: ChatIn, request: Request, user=Depends(current_user), db=Depends(get_db)):
    if not ai.is_configured():
        raise HTTPException(503, "AI not configured")

    client_ip = request.client.host if request.client else "unknown"
    if ai.rate_limited(client_ip):
        raise HTTPException(429, "Too many requests")

    # Цены гейтятся так же, как в /api/products: гостю модель их не назовёт
    context = ai.build_context(
        db, body.message, body.product_id, body.lang, unlocked=user is not None
    )
    messages = ai.build_messages(
        context, [turn.model_dump() for turn in body.history], body.message, body.lang
    )

    try:
        reply = ai.ask(messages)
    except RuntimeError as err:
        raise HTTPException(502, str(err)) from err

    reply = ai.clean_reply(reply)
    # Гейт цен держим кодом, а не доверием к модели
    if user is None:
        reply = ai.guest_safe(reply, db, body.lang)
    return {"reply": reply}


def ai_guard(request: Request):
    """Общая защита ИИ-эндпоинтов: без неё ключ OpenRouter жёгся без ограничений."""
    if not ai.is_configured():
        raise HTTPException(503, "AI not configured")
    client_ip = request.client.host if request.client else "unknown"
    if ai.rate_limited(client_ip):
        raise HTTPException(429, "Too many requests")


@router.post("/api/ai/compare-verdict")
def ai_compare_verdict(body: CompareVerdictIn, request: Request, user=Depends(current_user), db=Depends(get_db)):
    """ИИ-сравнение выбранных товаров: отличия, кому подойдёт, вердикт."""
    for pid in body.product_ids:
        ensure_product(db, pid)
    ai_guard(request)
    # цены гейтятся так же, как в /api/products: гостю модель их не увидит
    return ai.generate_comparison_verdict(db, body.product_ids, body.lang, unlocked=user is not None)


@router.get("/api/ai/price-advisor/{product_id}")
def ai_price_advisor(product_id: str, request: Request,
                     lang: Literal["ru", "uz", "en"] = "ru",
                     user=Depends(require_user), db=Depends(get_db)):
    """ИИ-советник по цене: выгодный момент, стабильная цена или завышенная.

    Целиком построен на ценах и истории, поэтому доступен только вошедшим.
    """
    ensure_product(db, product_id)
    return ai.generate_price_advice(db, product_id, lang)


@router.get("/api/ai/reviews-summary/{product_id}")
def ai_reviews_summary(product_id: str, request: Request,
                       lang: Literal["ru", "uz", "en"] = "ru", db=Depends(get_db)):
    """ИИ-обзор товара по рейтингу и отметкам каталога. Цен не содержит."""
    ensure_product(db, product_id)
    ai_guard(request)
    return ai.generate_reviews_summary(db, product_id, lang)


@router.post("/api/ai/bundle-builder")
def ai_bundle_builder(body: BundleIn, request: Request, user=Depends(current_user), db=Depends(get_db)):
    """ИИ-сборщик комплектов под задачу и бюджет из каталога."""
    ai_guard(request)
    return ai.generate_bundle(db, body.query, body.budget, body.category_id, body.lang,
                              unlocked=user is not None)
