"""
AI Analysis Service - Analyze requirements using OpenRouter LLM.
"""

import json
import os
from typing import Optional
from pydantic import BaseModel


class AIAnalysisResult(BaseModel):
    """Result from AI analysis."""
    completeness_score: int  # 0-100
    ambiguities: list[str]
    risks: list[str]
    recommendations: list[str]
    summary: str


ANALYSIS_PROMPT = """You are a senior QA analyst. Analyze this requirement:

Title: {title}
Description: {description}
Acceptance Criteria: {acceptance_criteria}
Business Rules: {business_rules}
Module: {module}
Type: {type}
Priority: {priority}

Return JSON:
{{
    "completeness_score": <0-100>,
    "ambiguities": ["unclear parts"],
    "risks": ["potential risks"],
    "recommendations": ["improvement suggestions"],
    "summary": "brief assessment"
}}

Score guide:
- 90-100: Excellent
- 70-89: Good
- 50-69: Average
- 0-49: Needs work
"""


async def analyze_requirement(
    title: str,
    description: str | None = None,
    acceptance_criteria: str | None = None,
    business_rules: str | None = None,
    module: str | None = None,
    type: str | None = None,
    priority: str | None = None,
) -> AIAnalysisResult:
    """Analyze a requirement using OpenRouter LLM."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    
    if not api_key:
        return _get_mock_analysis(title)

    try:
        import httpx
    except ImportError:
        return _get_mock_analysis(title)
    
    prompt = ANALYSIS_PROMPT.format(
        title=title,
        description=description or "Not provided",
        acceptance_criteria=acceptance_criteria or "Not provided",
        business_rules=business_rules or "Not provided",
        module=module or "Not specified",
        type=type or "Not specified",
        priority=priority or "Not specified",
    )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://nexqa.app",
                    "X-Title": "NexQA Requirement Analysis",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "Always respond with valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000,
                },
                timeout=30.0,
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                
                # Parse JSON
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                result = json.loads(content.strip())
                
                return AIAnalysisResult(
                    completeness_score=min(100, max(0, result.get("completeness_score", 50))),
                    ambiguities=result.get("ambiguities", []),
                    risks=result.get("risks", []),
                    recommendations=result.get("recommendations", []),
                    summary=result.get("summary", "Analysis completed."),
                )
            else:
                return _get_mock_analysis(title)
                
    except Exception as e:
        print(f"AI Analysis error: {e}")
        return _get_mock_analysis(title)


def _get_mock_analysis(title: str) -> AIAnalysisResult:
    """Return mock analysis for testing/fallback."""
    title_len = len(title.split())
    
    if title_len < 3:
        score = 35
        ambiguities = ["Title is too short and lacks context"]
        risks = ["Requirement may be misinterpreted"]
        recommendations = ["Expand the title to clearly state the requirement"]
    elif title_len < 6:
        score = 65
        ambiguities = ["Description could be more detailed"]
        risks = ["Some edge cases may not be covered"]
        recommendations = ["Add more specific details", "Consider adding acceptance criteria"]
    else:
        score = 82
        ambiguities = ["Consider adding performance criteria"]
        risks = ["Security aspects should be addressed"]
        recommendations = [
            "Add non-functional requirements",
            "Include error handling scenarios",
            "Define success metrics"
        ]
    
    return AIAnalysisResult(
        completeness_score=score,
        ambiguities=ambiguities,
        risks=risks,
        recommendations=recommendations,
        summary=f"Requirement '{title}' analyzed. Score: {score}/100",
    )
