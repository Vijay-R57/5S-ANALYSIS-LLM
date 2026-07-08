import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const payload = await req.json();
    const action = payload.action ?? "audit";

    if (action === "visualize") {
      // Mock visualize action if needed
      return new Response(
        JSON.stringify({
          success: true,
          visualizedImageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
        }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Default audit action - returns standard AuditAnalysisResult
    const mockResult = {
      template: {
        id: "std-5s-v1",
        name: "Standard 5S Audit",
        version: "1.0.0",
      },
      prompt_version: "v1.0",
      vision_model: "mock-model",
      schema_version: "1.0",
      audit_confidence: 0.95,
      before: {
        score: {
          pillar_scores: [
            {
              pillar: "Sort",
              score: 80,
              maximum: 100,
              percentage: 80,
              raw_percentage: 80,
              passed: 4,
              partial: 0,
              failed: 1,
              not_visible: 0,
              not_applicable: 0,
              critical: 0,
              cap_applied: false,
              top_deductions: [
                {
                  question_id: "sort-q1",
                  question_text: "Are unnecessary items identified, tagged, and removed?",
                  severity: "MAJOR",
                  evidence: "A few unused boxes found under the desk.",
                  points_lost: 20,
                },
              ],
            },
            {
              pillar: "Set in Order",
              score: 90,
              maximum: 100,
              percentage: 90,
              raw_percentage: 90,
              passed: 9,
              partial: 0,
              failed: 1,
              not_visible: 0,
              not_applicable: 0,
              critical: 0,
              cap_applied: false,
              top_deductions: [],
            },
            {
              pillar: "Shine",
              score: 85,
              maximum: 100,
              percentage: 85,
              raw_percentage: 85,
              passed: 8,
              partial: 1,
              failed: 1,
              not_visible: 0,
              not_applicable: 0,
              critical: 0,
              cap_applied: false,
              top_deductions: [],
            },
            {
              pillar: "Standardize",
              score: 95,
              maximum: 100,
              percentage: 95,
              raw_percentage: 95,
              passed: 19,
              partial: 0,
              failed: 1,
              not_visible: 0,
              not_applicable: 0,
              critical: 0,
              cap_applied: false,
              top_deductions: [],
            },
            {
              pillar: "Sustain",
              score: 100,
              maximum: 100,
              percentage: 100,
              raw_percentage: 100,
              passed: 10,
              partial: 0,
              failed: 0,
              not_visible: 0,
              not_applicable: 0,
              critical: 0,
              cap_applied: false,
              top_deductions: [],
            },
          ],
          overall_score: 90,
          overall_maximum: 100,
          overall_percentage: 90,
          grade: "Excellent",
          grade_color: "green",
          total_answered: 45,
          total_questions: 50,
          critical_failures: 0,
          computed_at: new Date().toISOString(),
        },
        responses: [
          {
            question_id: "sort-q1",
            ai_answer: "NO",
            confidence: 0.9,
            evidence: "Unused boxes under the desk.",
          },
        ],
      },
      recommendations: [
        {
          pillar: "Sort",
          severity: "MAJOR",
          priority: 1,
          priority_label: "High Priority",
          title: "Remove Unused Boxes",
          description: "Clear all unused packaging and cardboard boxes from workspace.",
          problem: "Unnecessary packaging under workspace cluttering desk area.",
          root_cause: "Delayed disposal of packing materials.",
          corrective_action: "Dispose of boxes in recycling bin.",
          linked_question_id: "sort-q1",
        },
      ],
      improvement_prompt: "Clean up unused items to achieve a perfect Sort score.",
      explainability_report: null,
      scoringMethod: "CV Engine",
    };

    return new Response(JSON.stringify(mockResult), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Internal Server Error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
