import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI

router = APIRouter()


def get_client() -> OpenAI:
    return OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL"),
        timeout=60.0,
    )


@router.get("/test")
def test_endpoint():
    return {"message": "Hello from FastAPI backend!"}


SCENARIO_PROMPTS = {
    "interview": (
        "You are a strict but fair interviewer at a top tech company. "
        "Conduct a realistic job interview in English. Ask professional questions "
        "about the candidate's experience, skills, and goals. "
        "If their answer is weak, push back politely and ask for more detail."
    ),
    "restaurant": (
        "You are a friendly waiter at a busy English-speaking restaurant. "
        "Greet the customer, present the menu, take their order, and handle "
        "special requests naturally. Use restaurant vocabulary and polite expressions."
    ),
    "meeting": (
        "You are a professional colleague in a business meeting. "
        "Discuss project updates, deadlines, and action items. "
        "Use formal meeting language, ask clarifying questions, and "
        "occasionally challenge ideas constructively."
    ),
}

JSON_FORMAT_INSTRUCTION = """\

You MUST respond in valid JSON with exactly these three keys:
- "reply": your conversational reply in English, staying in character
- "grammar_correction": if the user's sentence has grammar/vocabulary errors, write a brief correction like "You should say: ...". If there are no errors, write "" (empty string).
- "pronunciation_score": an integer 0-100, informed by the "confidence" value passed in the user message

Rules:
1. Always output ONLY valid JSON, no markdown, no code fences.
2. Keep "reply" concise (1-3 sentences).
3. Be encouraging but precise with corrections.
4. If confidence >= 85, pronunciation_score should reflect that (80-100).
   If confidence is 60-84, score 60-79.
   If confidence < 60, score below 60.
5. Stay in character for the entire conversation.
"""


class ChatRequest(BaseModel):
    text: str
    confidence: int | None = None
    scenario: str = "interview"


class ChatResponse(BaseModel):
    reply: str
    grammar_correction: str
    pronunciation_score: int


@router.post("/send", response_model=ChatResponse)
def send_message(req: ChatRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is empty")

    confidence = req.confidence if req.confidence is not None else 85
    user_msg = f"[confidence={confidence}] {req.text}"

    role_prompt = SCENARIO_PROMPTS.get(req.scenario, SCENARIO_PROMPTS["interview"])
    system_prompt = role_prompt + JSON_FORMAT_INSTRUCTION

    try:
        client = get_client()
        completion = client.chat.completions.create(
            model="mimo-v2.5-pro",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg},
            ],
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)
        return ChatResponse(
            reply=data.get("reply", ""),
            grammar_correction=data.get("grammar_correction", ""),
            pronunciation_score=int(data.get("pronunciation_score", confidence)),
        )
    except json.JSONDecodeError:
        return ChatResponse(
            reply=raw if "raw" in dir() else "Sorry, I couldn't parse the response.",
            grammar_correction="",
            pronunciation_score=confidence,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
