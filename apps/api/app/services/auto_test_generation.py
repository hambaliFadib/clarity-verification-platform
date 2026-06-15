"""
Auto Test Generation Service — AI generates test cases from requirements.
"""

import os
import json
from pydantic import BaseModel


class GeneratedTestCase(BaseModel):
    """Generated test case from AI."""
    title: str
    description: str
    module: str
    type: str
    severity: str
    steps: list[dict]
    expected_result: str
    test_data: str | None = None


class AutoTestGeneration:
    """Generate test cases from requirements using AI."""
    
    SYSTEM_PROMPT = """You are a senior QA engineer. Generate test cases from the given requirement.

For each test case, return JSON with:
- title: Clear test case title
- description: What this test verifies
- module: Module name
- type: Functional, Regression, Smoke, Integration
- severity: Critical, High, Medium, Low
- steps: Array of {action, expected_result}
- expected_result: Overall expected outcome
- test_data: Sample test data if needed

Generate 3-5 test cases covering:
1. Happy path (valid input)
2. Error handling (invalid input)
3. Edge cases
4. Boundary conditions
5. Security considerations (if applicable)
"""
    
    async def generate_from_requirement(
        self,
        title: str,
        description: str | None = None,
        acceptance_criteria: str | None = None,
    ) -> list[GeneratedTestCase]:
        """Generate test cases from a requirement."""
        api_key = os.getenv("OPENROUTER_API_KEY")
        
        if not api_key:
            return self._mock_generation(title)
        
        prompt = f"""Requirement:
Title: {title}
Description: {description or 'Not provided'}
Acceptance Criteria: {acceptance_criteria or 'Not provided'}

Generate test cases in JSON format."""
        
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
                        "messages": [
                            {"role": "system", "content": self.SYSTEM_PROMPT},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 2000,
                    },
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    
                    # Parse JSON
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0]
                    
                    result = json.loads(content.strip())
                    return [GeneratedTestCase(**tc) for tc in result.get("test_cases", [])]
        except Exception as e:
            print(f"Auto generation error: {e}")
        
        return self._mock_generation(title)
    
    def _mock_generation(self, title: str) -> list[GeneratedTestCase]:
        """Generate mock test cases for testing."""
        return [
            GeneratedTestCase(
                title=f"Verify {title} with valid input",
                description=f"Test successful {title.lower()} scenario",
                module="Auto-Generated",
                type="Functional",
                severity="High",
                steps=[
                    {"action": "Navigate to the page", "expected_result": "Page loads successfully"},
                    {"action": "Enter valid data", "expected_result": "Data accepted"},
                    {"action": "Submit form", "expected_result": "Success message shown"},
                ],
                expected_result="Operation completed successfully",
            ),
            GeneratedTestCase(
                title=f"Verify {title} with invalid input",
                description=f"Test error handling for {title.lower()}",
                module="Auto-Generated",
                type="Functional",
                severity="Medium",
                steps=[
                    {"action": "Navigate to the page", "expected_result": "Page loads successfully"},
                    {"action": "Enter invalid data", "expected_result": "Validation error shown"},
                ],
                expected_result="Error message displayed clearly",
            ),
        ]
