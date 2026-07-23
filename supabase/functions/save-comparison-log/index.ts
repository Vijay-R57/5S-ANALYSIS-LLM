import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "5s-images";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      employeeId,
      employeeName,
      department,
      officeName,
      beforeImage,
      afterImage,
      analysisResult,
      scoringMethod,
      beforeGeo,
      afterGeo,
      capturedAt,
    } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeDept = (department || "unknown").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const safeEmpId = (employeeId || "unknown").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const pathPrefix = `${safeDept}/${safeEmpId}/${timestamp}`;

    let beforeImagePath: string | null = null;
    let afterImagePath: string | null = null;
    let uploadStatus = "uploaded";
    let uploadErrorStr: string | null = null;

    const uploadImage = async (base64: string, label: "before" | "after") => {
      const raw = base64.includes(",") ? base64.split(",")[1] : base64;
      const binary = atob(raw);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const path = `${pathPrefix}/${label}.jpg`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        throw error;
      }
      return path;
    };

    // Upload images to Storage
    try {
      if (beforeImage && afterImage) {
        const [beforePath, afterPath] = await Promise.all([
          uploadImage(beforeImage, "before"),
          uploadImage(afterImage, "after"),
        ]);
        beforeImagePath = beforePath;
        afterImagePath = afterPath;
      } else {
        throw new Error("Missing beforeImage or afterImage base64 payloads");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[save-comparison-log] Image storage upload failed:", errMsg);
      beforeImagePath = null;
      afterImagePath = null;
      uploadStatus = "pending";
      uploadErrorStr = errMsg;
    }

    // Insert log row into PostgreSQL
    const { error } = await supabase.from("analysis_logs").insert({
      employee_id: employeeId,
      employee_name: employeeName,
      department: department,
      office_name: officeName ?? null,
      before_image: null,
      after_image: null,
      before_image_path: beforeImagePath,
      after_image_path: afterImagePath,
      analysis_result: analysisResult,
      scoring_method: scoringMethod ?? "Gemini Vision",
      before_latitude: beforeGeo?.latitude ?? null,
      before_longitude: beforeGeo?.longitude ?? null,
      before_captured_at: beforeGeo?.capturedAt ?? null,
      after_latitude: afterGeo?.latitude ?? null,
      after_longitude: afterGeo?.longitude ?? null,
      after_captured_at: afterGeo?.capturedAt ?? null,
      overall_score_before: analysisResult?.beforeScores
        ? Math.round(Object.values(analysisResult.beforeScores as Record<string, number>).reduce((a, b) => a + b, 0) / 5)
        : null,
      overall_score_after: analysisResult?.afterScores
        ? Math.round(Object.values(analysisResult.afterScores as Record<string, number>).reduce((a, b) => a + b, 0) / 5)
        : null,
      lean_maintenance_score: analysisResult?.leanMaintenanceScore ?? null,
      captured_at: capturedAt ?? new Date().toISOString(),
    });

    if (error) {
      console.error("[save-comparison-log] DB insert failed:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save analysis log to database", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        uploadStatus,
        beforeImagePath,
        afterImagePath,
        uploadError: uploadErrorStr,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[save-comparison-log] Internal error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
