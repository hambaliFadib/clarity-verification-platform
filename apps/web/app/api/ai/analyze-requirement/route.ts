import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AnalysisResult = {
  completeness_score: number;
  ambiguities: string[];
  risks: string[];
  recommendations: string[];
  summary: string;
};

function clampScore(value: unknown, fallback = 50) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item)).filter(Boolean)
    : [];
}

function heuristicAnalysis(payload: any): AnalysisResult {
  const title = String(payload?.title || "").trim();
  const description = String(payload?.description || "").trim();
  const acceptanceCriteria = String(payload?.acceptanceCriteria || payload?.acceptance_criteria || "").trim();
  const businessRules = String(payload?.businessRules || payload?.business_rules || "").trim();
  const type = String(payload?.type || "").trim();

  let score = 35;
  const ambiguities: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];

  if (title.split(/\s+/).filter(Boolean).length >= 5) score += 15;
  else ambiguities.push("Requirement title needs more business context.");

  if (description.length >= 80) score += 15;
  else recommendations.push("Expand the description with actor, trigger, and expected behavior.");

  if (acceptanceCriteria.length >= 40) score += 20;
  else {
    ambiguities.push("Acceptance criteria are missing or too thin.");
    recommendations.push("Add measurable acceptance criteria before approval.");
  }

  if (businessRules.length >= 20) score += 10;
  else recommendations.push("Document validation rules, constraints, or policy logic.");

  if (/security|performance|reliability|operational|non-functional/i.test(`${type} ${description}`)) {
    score += 10;
  } else {
    risks.push("Non-functional requirements may be under-specified.");
  }

  if (!acceptanceCriteria) {
    risks.push("QA coverage and traceability will be weak without clear acceptance criteria.");
  }

  const finalScore = clampScore(score);
  return {
    completeness_score: finalScore,
    ambiguities,
    risks,
    recommendations,
    summary: `Requirement analysis completed with a completeness score of ${finalScore}/100.`,
  };
}

function extractJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1] || content;
}

async function openRouterAnalysis(payload: any): Promise<AnalysisResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const prompt = `Analyze this software requirement for QA readiness.

Title: ${payload.title || ""}
Description: ${payload.description || ""}
Acceptance Criteria: ${payload.acceptanceCriteria || payload.acceptance_criteria || ""}
Business Rules: ${payload.businessRules || payload.business_rules || ""}
Module: ${payload.module || ""}
Type: ${payload.type || ""}
Priority: ${payload.priority || ""}

Return strict JSON with keys: completeness_score, ambiguities, risks, recommendations, summary.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "https://nexqa.hambalifadib.my.id",
        "X-Title": "NexQA Requirement Analysis",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(extractJson(content).trim());
    return {
      completeness_score: clampScore(parsed.completeness_score),
      ambiguities: toStringArray(parsed.ambiguities),
      risks: toStringArray(parsed.risks),
      recommendations: toStringArray(parsed.recommendations),
      summary: String(parsed.summary || "Requirement analysis completed."),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!String(body?.title || "").trim()) {
      return NextResponse.json({ error: "Requirement title is required." }, { status: 400 });
    }

    const result = await openRouterAnalysis(body);
    return NextResponse.json(result || heuristicAnalysis(body));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
