/**
 * src/modules/comparison/hooks/useComparisonPipeline.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Gemini Vision AI Comparison Pipeline Hook (ARCOLAB V2 Architecture).
 *
 * Relocated from Arcolab/frontend/src/hooks/useAnalysisPipeline.ts
 * Adaptations:
 *  • Import paths updated to use shared @/ infrastructure
 *  • GeoMeta imported from comparison components (isolated)
 *  • Edge Function target changed from "analyze-5s" to "analyze-5s-comparison"
 *  • Log saver changed from "save-analysis-log" to "save-comparison-log"
 *  • Business logic: UNCHANGED
 *
 * Features:
 *  • Direct invocation of analyze-5s-comparison Edge Function (Gemini Vision)
 *  • Automatic Direct Gemini API Fallback if Edge Function returns 401 or offline
 *  • Stage-aware progress (compressing → analyzing → saving → complete)
 *  • Response validation & strict typing
 *  • Fire-and-forget Supabase log save
 */

import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { AnalysisData, AnalysisPipelineState, AnalysisStage } from "@/modules/comparison/types/comparison";
import type { GeoMeta } from "@/modules/comparison/components/ImageUploader";

// ── Config ────────────────────────────────────────────────────────────────────
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

// ── Image utilities ───────────────────────────────────────────────────────────
export const resizeImage = (base64: string, maxDim = 1024): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const cw = Math.round(img.naturalWidth * scale);
      const ch = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      canvas.getContext("2d")!.drawImage(img, 0, 0, cw, ch);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Failed to load image for resizing"));
    img.src = base64;
  });

// ── Response validator ────────────────────────────────────────────────────────
function validateAnalysisResponse(data: unknown): data is AnalysisData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  const hasScores =
    typeof d.beforeScores === "object" &&
    typeof d.afterScores === "object" &&
    d.beforeScores !== null &&
    d.afterScores !== null;
  const hasContent =
    typeof d.overview === "string" &&
    Array.isArray(d.recommendations) &&
    Array.isArray(d.improvements);
  return hasScores && hasContent;
}

// ── Direct Client-Side Gemini Vision Fallback ─────────────────────────────────
async function callDirectGeminiVision(
  before: string,
  after: string,
  officeName: string,
  auditZone?: string
): Promise<AnalysisData> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in .env");
  }

  const promptText = `
You are an expert Executive 5S Auditor and Industrial Lean Manufacturing Specialist at ARCOLAB.
Your objective is to perform a detailed, objective, visual 5S Comparison Audit between Image 1 (BEFORE) and Image 2 (AFTER).

Audit Zone: ${auditZone || "General Industrial Workspace"}
Office/Facility: ${officeName || "ARCOLAB Site"}

Evaluate 5S Categories (0-100 integer score for Before and After):
- Sort (Seiri)
- Set in Order (Seiton)
- Shine (Seiso)
- Standardize (Seiketsu)
- Sustain (Shitsuke)

Also evaluate Total Productive Maintenance / Lean Maintenance score (0-100) for Before and After.

Return ONLY a valid JSON object with exact structure:
{
  "overview": "summary string",
  "beforeScores": { "sort": 75, "setInOrder": 70, "shine": 65, "standardize": 80, "sustain": 80 },
  "afterScores": { "sort": 95, "setInOrder": 90, "shine": 92, "standardize": 90, "sustain": 95 },
  "beforeExplanations": { "sort": "...", "setInOrder": "...", "shine": "...", "standardize": "...", "sustain": "..." },
  "afterExplanations": { "sort": "...", "setInOrder": "...", "shine": "...", "standardize": "...", "sustain": "..." },
  "improvements": ["improvement 1", "improvement 2"],
  "recommendations": ["rec 1", "rec 2"],
  "rootCauseObservations": ["observation 1"],
  "safetyRecommendations": ["safety 1"],
  "leanMaintenanceScore": 70,
  "leanMaintenanceScoreAfter": 92,
  "leanMaintenanceExplanation": "explanation of TPM improvements",
  "scoringMethod": "Gemini Vision"
}
`;

  const beforeClean = before.replace(/^data:image\/\w+;base64,/, "");
  const afterClean = after.replace(/^data:image\/\w+;base64,/, "");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: promptText },
              { inlineData: { mimeType: "image/jpeg", data: beforeClean } },
              { inlineData: { mimeType: "image/jpeg", data: afterClean } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Vision API error (${response.status}): ${errText}`);
  }

  const rawJson = await response.json();
  const text = rawJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini Vision API");
  }

  const parsed = JSON.parse(text);
  parsed.scoringMethod = "Gemini Vision";
  return parsed as AnalysisData;
}

// ── Retry wrapper with Resilient Auth & Direct Fallback ────────────────────────
async function invokeWithRetry(
  before: string,
  after: string,
  officeName: string,
  auditZone?: string,
  onAttempt?: (attempt: number) => void,
  attempt = 0
): Promise<AnalysisData> {
  if (onAttempt && attempt > 0) {
    onAttempt(attempt);
  }

  const bypass = import.meta.env.VITE_BYPASS_SUPABASE_FUNCTIONS === "true";
  if (bypass) {
    console.log("[useComparisonPipeline] Running direct Gemini API analysis (Local/Bypass Mode)");
    return await callDirectGeminiVision(before, after, officeName, auditZone);
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  try {
    let rawData: unknown;

    // 1. Try standard Supabase SDK invocation
    const { data, error } = await supabase.functions.invoke("analyze-5s-comparison", {
      body: {
        beforeImage: before,
        afterImage: after,
        officeName,
        auditZone,
      },
      headers: {
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (error || !data) {
      console.warn("[useComparisonPipeline] Edge function invocation issue, attempting direct HTTP fetch...", error);

      try {
        // 2. Direct Edge Function HTTP fetch
        const res = await fetch(`${supabaseUrl}/functions/v1/analyze-5s-comparison`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anonKey}`,
            "apikey": anonKey,
          },
          body: JSON.stringify({
            beforeImage: before,
            afterImage: after,
            officeName,
            auditZone,
          }),
        });

        if (res.ok) {
          rawData = await res.json();
        } else {
          console.warn(`[useComparisonPipeline] Edge function HTTP ${res.status}, falling back to Direct Gemini API...`);
          rawData = await callDirectGeminiVision(before, after, officeName, auditZone);
        }
      } catch (fallbackErr) {
        console.warn("[useComparisonPipeline] Direct fetch failed, invoking direct Gemini Vision API...", fallbackErr);
        rawData = await callDirectGeminiVision(before, after, officeName, auditZone);
      }
    } else {
      rawData = data;
    }

    if (rawData && typeof rawData === "object" && "error" in rawData) {
      throw new Error(String((rawData as { error: unknown }).error));
    }

    if (!validateAnalysisResponse(rawData)) {
      throw new Error("The comparison analysis service returned an unexpected response format. Please try again.");
    }

    return rawData as AnalysisData;
  } catch (err: unknown) {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      return invokeWithRetry(before, after, officeName, auditZone, onAttempt, attempt + 1);
    }
    // Final direct Gemini fallback attempt before failing
    try {
      console.warn("[useComparisonPipeline] Exhausted retries, attempting direct Gemini Vision API fallback...");
      return await callDirectGeminiVision(before, after, officeName, auditZone);
    } catch {
      throw err;
    }
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useComparisonPipeline(officeName: string) {
  const [pipeline, setPipeline] = useState<AnalysisPipelineState>({
    stage: "idle",
    progress: 0,
    message: "",
    retryCount: 0,
  });
  const [results, setResults] = useState<AnalysisData | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | null>(null);
  const abortRef = useRef(false);

  const { toast } = useToast();
  const { employee } = useAuth();

  const setStage = useCallback(
    (stage: AnalysisStage, progress: number, message: string, retryCount = 0) => {
      setPipeline({ stage, progress, message, retryCount });
    },
    []
  );

  const runAnalysis = useCallback(
    async (
      beforeImage: string,
      afterImage: string,
      beforeGeo: GeoMeta | null,
      afterGeo: GeoMeta | null,
      auditZone?: string
    ) => {
      abortRef.current = false;
      setResults(null);

      try {
        // ── Stage 1: Compress ────────────────────────────────────────────────
        setStage("compressing", 15, "Compressing images…");
        const [compBefore, compAfter] = await Promise.all([
          resizeImage(beforeImage, 1024),
          resizeImage(afterImage, 1024),
        ]);
        if (abortRef.current) return;

        // ── Stage 2: Analyze with Gemini Vision ──────────────────────────────
        setStage("analyzing", 45, "Analyzing with Gemini AI…");
        const data = await invokeWithRetry(compBefore, compAfter, officeName, auditZone, (attempt) => {
          setStage("analyzing", 45 + attempt * 15, `Retrying comparison analysis (attempt ${attempt + 1})…`, attempt);
        });

        if (abortRef.current) return;

        setResults(data);
        const ts = new Date().toISOString();
        setAnalysisTimestamp(ts);

        // ── Stage 3: Save log (resilient with direct DB fallback) ────────
        setStage("saving", 85, "Saving comparison record…");
        if (employee) {
          const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          const savePayload = {
            employee_id: employee.employeeId || "UNKNOWN",
            employee_name: employee.name || "Employee",
            department: employee.department || "Operational Excellence",
            office_name: officeName ?? null,
            before_image: null,
            after_image: null,
            analysis_result: data,
            scoring_method: data.scoringMethod ?? "Gemini Vision",
            captured_at: ts,
            upload_status: "uploaded",
          };

          supabase.functions
            .invoke("save-comparison-log", {
              body: {
                employeeId: employee.employeeId,
                employeeName: employee.name,
                department: employee.department,
                officeName,
                auditZone: auditZone || null,
                beforeImage,
                afterImage,
                analysisResult: data,
                scoringMethod: data.scoringMethod ?? "Gemini Vision",
                cvMetrics: null,
                beforeGeo: beforeGeo ?? null,
                afterGeo: afterGeo ?? null,
                capturedAt: ts,
              },
              headers: {
                Authorization: `Bearer ${anonKey}`,
              },
            })
            .then(async ({ error: logErr }) => {
              if (logErr) {
                console.warn("[useComparisonPipeline] Edge function log save issue, performing direct DB log insert...", logErr);
                await supabase.from("analysis_logs").insert(savePayload);
              }
            })
            .catch(async (logErr) => {
              console.warn("[useComparisonPipeline] Edge function log save offline, performing direct DB log insert...", logErr);
              await supabase.from("analysis_logs").insert(savePayload);
            });
        }

        setStage("complete", 100, "Comparison analysis complete");
        toast({
          title: "Analysis Complete",
          description: `5S Comparison scored using: ${data.scoringMethod ?? "Gemini Vision"}`,
        });
      } catch (err: unknown) {
        if (abortRef.current) return;
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        console.error("Comparison pipeline error:", err);
        setStage("error", 0, message);
        toast({
          title: "Analysis Failed",
          description: message,
          variant: "destructive",
        });
      }
    },
    [employee, officeName, setStage, toast]
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setResults(null);
    setAnalysisTimestamp(null);
    setPipeline({ stage: "idle", progress: 0, message: "", retryCount: 0 });
  }, []);

  return { pipeline, results, analysisTimestamp, runAnalysis, reset };
}
