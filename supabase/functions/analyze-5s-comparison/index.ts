import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      beforeImage,
      afterImage,
      auditZone,
      workspaceType,
      industry,
      officeName,
      area,
    } = await req.json();

    if (!beforeImage || !afterImage) {
      return new Response(
        JSON.stringify({ error: "Both before and after images are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("[analyze-5s-comparison] GEMINI_API_KEY environment variable is missing.");
      return new Response(
        JSON.stringify({ error: "Gemini Vision AI engine is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare image inline payloads (strip Data URL prefix if present)
    const cleanBase64 = (b64: string) => (b64.includes(",") ? b64.split(",")[1] : b64);
    const getMimeType = (b64: string) => {
      if (b64.startsWith("data:image/png")) return "image/png";
      if (b64.startsWith("data:image/webp")) return "image/webp";
      return "image/jpeg";
    };

    const beforeData = cleanBase64(beforeImage);
    const afterData = cleanBase64(afterImage);
    const beforeMime = getMimeType(beforeImage);
    const afterMime = getMimeType(afterImage);

    // ── ARCOLAB V2 Gemini Comparison Prompt Construction ────────────────────
    const systemPrompt = `
You are an expert Executive 5S Auditor and Industrial Lean Manufacturing Specialist at ARCOLAB.
Your objective is to perform a detailed, objective, visual 5S Comparison Audit between a BEFORE image and an AFTER image of a workplace.

[SYSTEM PERSONA]
- Professional, evidence-grounded, high-precision industrial auditor.
- Highly trained in 5S (Sort/Seiri, Set in Order/Seiton, Shine/Seiso, Standardize/Seiketsu, Sustain/Shitsuke) and TPM (Total Productive Maintenance).

[GLOBAL RULES & CONSTRAINTS]
1. VISUAL EVIDENCE GROUNDING: Every conclusion, score, explanation, improvement, regression, observation, and recommendation MUST be supported strictly by visually observable evidence from the provided BEFORE and AFTER images.
2. NEVER INFER UNSEEN CONDITIONS: Never assume unseen tools, documents, safety devices, eyewash stations, or equipment exist or are missing if they are outside the camera's field of view.
3. UNCERTAINTY HANDLING: If a feature cannot be visually confirmed in either image, do not assume improvement or regression. Mark it explicitly as indeterminable or focus only on clearly visible changes.
4. SCORES: Produce scores on a 0-100 integer scale for each of the 5S categories (sort, setInOrder, shine, standardize, sustain) for BOTH the Before state and the After state.
   - 80-100: World-class / Excellent compliance
   - 60-79: Fair / Acceptable condition with minor opportunities
   - 0-59: High clutter, disorganization, or safety hazard
5. LEAN MAINTENANCE: Evaluate Total Productive Maintenance (TPM) readiness and equipment cleanliness. Produce a Lean Maintenance score (0-100) for Before and After.

[WORKSPACE CONTEXT] (Contextual Metadata to aid operational interpretation only — NEVER visual evidence)
- Audit Zone: ${auditZone || "General Industrial Workspace"}
- Workspace Type: ${workspaceType || "Laboratory / Office / Shopfloor"}
- Industry: ${industry || "Pharmaceutical & Analytical Services"}
- Office / Facility: ${officeName || "Arcolab Campus"}
- Specific Area / Station: ${area || "Operational Workstation"}

[COMPARISON EVALUATION INSTRUCTIONS]
- Compare Image 1 (BEFORE) with Image 2 (AFTER).
- Identify VISUAL IMPROVEMENTS: Clutter removal, organized tools, shadow board usage, cleaned surfaces, labeled storage, hazard reduction.
- Identify VISUAL REGRESSIONS or REMAINING ISSUES: Items misplaced, ongoing clutter, uncleaned spills, missing labels.
- Provide clear per-pillar natural language explanations for BEFORE and AFTER states.
- Generate actionable, evidence-grounded recommendations for continuous improvement.
- Provide root-cause observations explaining underlying systemic factors for observed waste.
- Provide safety compliance recommendations based on visible hazards.

[JSON OUTPUT SCHEMA]
Return ONLY a valid JSON object matching the exact structure below. Do not include markdown code block formatting or extra commentary outside the JSON.

{
  "overview": "Detailed executive summary comparing Before and After states.",
  "beforeScores": {
    "sort": 70,
    "setInOrder": 65,
    "shine": 60,
    "standardize": 65,
    "sustain": 60
  },
  "afterScores": {
    "sort": 90,
    "setInOrder": 85,
    "shine": 88,
    "standardize": 85,
    "sustain": 80
  },
  "beforeExplanations": {
    "sort": "Observation of Before Sort state.",
    "setInOrder": "Observation of Before Set in Order state.",
    "shine": "Observation of Before Shine state.",
    "standardize": "Observation of Before Standardize state.",
    "sustain": "Observation of Before Sustain state."
  },
  "afterExplanations": {
    "sort": "Observation of After Sort state.",
    "setInOrder": "Observation of After Set in Order state.",
    "shine": "Observation of After Shine state.",
    "standardize": "Observation of After Standardize state.",
    "sustain": "Observation of After Sustain state."
  },
  "improvements": [
    "Specific visible improvement point 1",
    "Specific visible improvement point 2"
  ],
  "recommendations": [
    "Actionable evidence-grounded recommendation 1",
    "Actionable evidence-grounded recommendation 2"
  ],
  "rootCauseObservations": [
    "Root cause observation 1",
    "Root cause observation 2"
  ],
  "safetyRecommendations": [
    "Safety recommendation 1"
  ],
  "leanMaintenanceScore": 65,
  "leanMaintenanceScoreAfter": 85,
  "leanMaintenanceExplanation": "Lean maintenance analysis comparing machine cleanliness, tool access, and maintenance readiness between Before and After images."
}
`;

    // ── Call Gemini REST API (gemini-flash-latest) ───────────────────────
    const model = "gemini-flash-latest";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    console.log(`[analyze-5s-comparison] Invoking Gemini Vision API (${model})...`);

    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: beforeMime,
                data: beforeData,
              },
            },
            {
              inlineData: {
                mimeType: afterMime,
                data: afterData,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error(`[analyze-5s-comparison] Gemini API call failed (${geminiRes.status}):`, errBody);
      return new Response(
        JSON.stringify({ error: `Gemini Vision API error (${geminiRes.status}): ${errBody}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("[analyze-5s-comparison] Empty response from Gemini API:", JSON.stringify(geminiJson));
      return new Response(
        JSON.stringify({ error: "Gemini API returned an empty response." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsedResult: Record<string, unknown>;
    try {
      parsedResult = JSON.parse(rawText);
    } catch {
      console.error("[analyze-5s-comparison] JSON parse error on Gemini output:", rawText);
      return new Response(
        JSON.stringify({ error: "Failed to parse JSON response from Gemini Vision." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Attach Gemini scoring method tags
    const finalResponse = {
      ...parsedResult,
      scoringMethod: "Gemini Vision",
      rawScoringMethod: "Gemini Vision (v2-prompt-architecture)",
    };

    console.log("[analyze-5s-comparison] Gemini Vision Analysis success.");

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[analyze-5s-comparison] Unexpected error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
