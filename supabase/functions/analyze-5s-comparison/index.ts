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
    const { beforeImage, afterImage, officeName, zone } = await req.json();

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
      console.error("[analyze-5s-comparison] GEMINI_API_KEY is not set.");
      return new Response(
        JSON.stringify({ error: "Gemini API key is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean base64 strings
    const cleanBefore = beforeImage.includes(",") ? beforeImage.split(",")[1] : beforeImage;
    const cleanAfter = afterImage.includes(",") ? afterImage.split(",")[1] : afterImage;

    // Build V2 Prompt Architecture following 5S_Audit_Structured_Prompting_Philosophy.md
    const systemPrompt = `
SYSTEM PERSONA:
You are a Senior Industrial 5S Auditor & Lean Manufacturing Specialist conducting a 5S Comparison Analysis.

GLOBAL RULES:
1. EMPIRICAL VISUAL EVIDENCE ONLY: Every score, explanation, improvement, regression, and recommendation must be grounded strictly in visually observable evidence from the uploaded Before and After images. Never infer conditions outside the visible scene.
2. WORKSPACE CONTEXT BOUNDARY: Workspace Context (Facility/Office, Zone) is provided solely for contextual understanding of operational purpose. It MUST NEVER become visual evidence. Never assume an object, label, eyewash, or tool exists or is missing simply because of the Workspace Context.
3. COMPARATIVE EVIDENCE & UNCERTAINTY DIRECTIVES:
   - Compare only visually observable differences between Image 1 (Before) and Image 2 (After).
   - If an item or area cannot be visually confirmed in one or both images due to lighting, angle, or occlusion, do NOT infer improvement, deterioration, compliance, or non-compliance. State explicitly that it cannot be determined from visual evidence.
4. ZERO SCORING OFFLOADING CONSTRAINTS: Evaluate 5S pillars directly on a scale of 0 to 20 points per pillar (0=Critical Non-Compliance, 20=World-Class Excellence):
   - Sort (Seiri): Clutter removal, unnecessary items, obstruction elimination.
   - Set in Order (Seiton): Tool indexing, shadow boards, designated storage, visible labels.
   - Shine (Seiso): Surface cleanliness, dust/spill removal, equipment hygiene.
   - Standardize (Seiketsu): Visual controls, color coding, standardized layout.
   - Sustain (Shitsuke): Discipline, habituation, safety compliance, hazard elimination.
5. RECOMMENDATION RULES: Ground all recommendations in visible defects or remaining issues. Prioritize practical, actionable corrective steps.

WORKSPACE CONTEXT:
- Facility/Office: ${officeName || "General Industrial Workplace"}
- Audit Zone: ${zone || "General Production/Lab Area"}

INSTRUCTIONS:
Evaluate Image 1 (Before) and Image 2 (After). Output structured JSON adhering strictly to the schema provided.
`;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            { inline_data: { mime_type: "image/jpeg", data: cleanBefore } },
            { inline_data: { mime_type: "image/jpeg", data: cleanAfter } }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: "application/json"
      }
    };

    console.log("[analyze-5s-comparison] Invoking Gemini Vision API directly...");
    const geminiRes = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`[analyze-5s-comparison] Gemini API Error ${geminiRes.status}:`, errText);
      return new Response(
        JSON.stringify({ error: `Gemini API invocation failed: ${geminiRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return new Response(
        JSON.stringify({ error: "Gemini Vision API returned empty text candidate" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(candidateText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[analyze-5s-comparison] Internal error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
