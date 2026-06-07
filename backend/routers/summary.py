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
        timeout=120.0,
    )


class HistoryMessage(BaseModel):
    role: str
    content: str
    grammar_correction: str | None = None
    pronunciation_score: int | None = None


class SummaryRequest(BaseModel):
    messages: list[HistoryMessage]
    language: str = "en"


class SummaryResponse(BaseModel):
    overall_score: int
    grammar_review: str
    vocabulary_feedback: str
    next_steps: str


SYSTEM_PROMPT_EN = """\
You are an experienced English speaking coach. Based on the conversation history below, generate a structured practice report.

You MUST respond in valid JSON with exactly these four keys:
- "overall_score": an integer 1-100 representing the student's overall performance
- "grammar_review": a detailed paragraph (3-5 sentences) analyzing the student's grammar patterns, highlighting recurring mistakes and strengths
- "vocabulary_feedback": a paragraph (3-5 sentences) evaluating the student's vocabulary range, diversity, and appropriateness
- "next_steps": a paragraph (3-5 sentences) with specific, actionable suggestions for improvement

Rules:
1. Always output ONLY valid JSON, no markdown, no code fences.
2. Be encouraging but honest.
3. Reference specific examples from the conversation where possible.
4. Consider the pronunciation scores when forming your overall assessment.
5. Write all text values in ENGLISH.
"""

SYSTEM_PROMPT_ZH = """\
你是一位经验丰富的英语口语教练。请根据下面的对话历史，生成一份结构化的练习报告。

你必须用合法的 JSON 格式返回，包含以下四个字段：
- "overall_score": 整数 1-100，表示学生的综合表现
- "grammar_review": 一段话（3-5 句），分析学生的语法模式，指出常见错误和优点
- "vocabulary_feedback": 一段话（3-5 句），评估学生词汇的丰富度、多样性和恰当性
- "next_steps": 一段话（3-5 句），给出具体、可操作的改进建议

规则：
1. 只输出合法 JSON，不要 markdown，不要代码块。
2. 语气鼓励但诚实。
3. 尽量引用对话中的具体例子。
4. 结合发音分数进行综合评估。
5. 【最重要】所有文本值（grammar_review, vocabulary_feedback, next_steps）必须全部用中文撰写。严禁使用英文。对话中的英文引用可以用引号标注，但评价和分析文字必须是中文。
"""


@router.post("/generate", response_model=SummaryResponse)
def generate_summary(req: SummaryRequest):
    if len(req.messages) < 2:
        raise HTTPException(
            status_code=400, detail="Need at least 2 messages for a summary"
        )

    conversation = ""
    for msg in req.messages:
        prefix = "Student" if msg.role == "user" else "Coach"
        conversation += f"{prefix}: {msg.content}\n"
        if msg.grammar_correction:
            conversation += f"  [correction: {msg.grammar_correction}]\n"
        if msg.pronunciation_score is not None:
            conversation += f"  [pronunciation_score: {msg.pronunciation_score}]\n"

    try:
        client = get_client()

        # Step 1: Always generate the report in English first (more reliable)
        completion = client.chat.completions.create(
            model="mimo-v2.5-pro",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {"role": "user", "content": f"Conversation history:\n\n{conversation}"},
            ],
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)

        result = {
            "overall_score": int(data.get("overall_score", 70)),
            "grammar_review": data.get("grammar_review", ""),
            "vocabulary_feedback": data.get("vocabulary_feedback", ""),
            "next_steps": data.get("next_steps", ""),
        }

        # Step 2: If language is zh, translate the text fields to Chinese
        if req.language == "zh":
            translate_prompt = (
                "请将以下英文练习报告翻译成中文。"
                "保持 JSON 格式不变，只翻译文本值。"
                "overall_score 保持数字不变。语气自然流畅，符合中文表达习惯。\n\n"
                f'grammar_review: {result["grammar_review"]}\n\n'
                f'vocabulary_feedback: {result["vocabulary_feedback"]}\n\n'
                f'next_steps: {result["next_steps"]}'
            )
            translate_completion = client.chat.completions.create(
                model="mimo-v2.5-pro",
                messages=[
                    {"role": "system", "content": "你是一位专业的中英翻译。请将英文内容翻译成自然流畅的中文。只输出合法 JSON，不要 markdown。"},
                    {"role": "user", "content": translate_prompt},
                ],
                response_format={"type": "json_object"},
            )
            t_raw = translate_completion.choices[0].message.content or "{}"
            t_data = json.loads(t_raw)
            result["grammar_review"] = t_data.get("grammar_review", result["grammar_review"])
            result["vocabulary_feedback"] = t_data.get("vocabulary_feedback", result["vocabulary_feedback"])
            result["next_steps"] = t_data.get("next_steps", result["next_steps"])

        return SummaryResponse(**result)
    except json.JSONDecodeError:
        fallback = {
            "en": ("Unable to parse analysis.", "Keep practicing!"),
            "zh": ("无法解析分析结果。", "继续加油！"),
        }
        g, n = fallback.get(req.language, fallback["en"])
        return SummaryResponse(
            overall_score=70,
            grammar_review=g,
            vocabulary_feedback=g,
            next_steps=n,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
