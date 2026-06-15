"""
Defect Root Cause Analysis — AI analyzes defect patterns.
"""

import os
import json
from pydantic import BaseModel


class DefectAnalysisResult(BaseModel):
    """Root cause analysis result."""
    root_cause_category: str
    confidence: int
    similar_defects: list[str]
    prevention_suggestions: list[str]
    affected_modules: list[str]
    risk_score: int


class DefectAnalysis:
    """Analyze defects for root causes and patterns."""
    
    async def analyze_defect(
        self,
        title: str,
        description: str | None = None,
        steps_to_reproduce: str | None = None,
        severity: str | None = None,
    ) -> DefectAnalysisResult:
        """Analyze a defect for root cause."""
        # Simple heuristic analysis
        categories = {
            "ui": ["button", "click", "display", "show", "hide", "css", "style", "layout"],
            "api": ["api", "endpoint", "request", "response", "timeout", "error"],
            "data": ["data", "database", "sql", "query", "save", "delete", "update"],
            "auth": ["login", "password", "token", "session", "permission", "access"],
            "performance": ["slow", "timeout", "loading", "performance", "memory"],
        }
        
        text = f"{title} {description} {steps_to_reproduce}".lower()
        
        # Determine category
        category_scores = {}
        for cat, keywords in categories.items():
            score = sum(1 for kw in keywords if kw in text)
            category_scores[cat] = score
        
        root_cause = max(category_scores, key=category_scores.get) if any(category_scores.values()) else "unknown"
        
        # Generate prevention suggestions
        suggestions = {
            "ui": ["Add UI automation tests", "Implement visual regression testing", "Review component library usage"],
            "api": ["Add API contract testing", "Implement retry logic", "Add timeout handling"],
            "data": ["Add data validation", "Implement transaction rollback", "Add database constraints"],
            "auth": ["Add authentication tests", "Review permission logic", "Implement session timeout"],
            "performance": ["Add performance benchmarks", "Implement caching", "Optimize database queries"],
        }
        
        return DefectAnalysisResult(
            root_cause_category=root_cause,
            confidence=min(100, max(30, category_scores.get(root_cause, 0) * 20)),
            similar_defects=[],
            prevention_suggestions=suggestions.get(root_cause, ["Review and refactor"]),
            affected_modules=[],
            risk_score=70 if severity in ["Critical", "High"] else 40,
        )
