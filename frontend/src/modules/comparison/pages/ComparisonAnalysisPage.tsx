import { useState, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageUploader, { GeoMeta } from "@/components/ImageUploader";
import ComparisonAnalysisResults from "../components/ComparisonAnalysisResults";
import ComparisonAnalysisProgress from "../components/ComparisonAnalysisProgress";
import { Loader2, Sparkles, User, BadgeCheck, Building2, MapPin, AlertTriangle, RotateCcw, GitCompare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useComparisonPipeline } from "../hooks/useComparisonPipeline";
import { ZONE_OPTIONS, ZONE_KNOWLEDGE } from "@/modules/audit/constants/zoneKnowledge";
import arcolabLogoSrc from "@/assets/arcolab-logo.png";
import sampleBefore from "@/assets/sample-before.jpg";
import sampleAfter from "@/assets/sample-after.jpg";

// Loads Arcolab logo as an Image element (cached after first load)
let cachedLogo: HTMLImageElement | null = null;
const loadArcolabLogo = (): Promise<HTMLImageElement> => {
  if (cachedLogo) return Promise.resolve(cachedLogo);
  return new Promise((resolve) => {
    const logo = new Image();
    logo.onload = () => { cachedLogo = logo; resolve(logo); };
    logo.onerror = () => resolve(logo);
    logo.src = arcolabLogoSrc;
  });
};

// Bakes employee name + office + zone + date + time (+ geo) + Arcolab logo as a watermark onto the image via canvas
const applyWatermark = (raw: string, employeeName: string, employeeId: string, officeName: string, zoneName?: string | null): Promise<string> => {
  let geoLine: string | null = null;
  let base64 = raw;
  const geoMatch = raw.match(/^__geo:([-\d.]+),([-\d.]+):([^_]*)__(.+)$/s);
  if (geoMatch) {
    const lat = parseFloat(geoMatch[1]).toFixed(5);
    const lng = parseFloat(geoMatch[2]).toFixed(5);
    const addr = geoMatch[3];
    geoLine = addr ? `📍 ${addr}` : `📍 ${lat}, ${lng}`;
    base64 = geoMatch[4];
  }

  return new Promise((resolve) => {
    Promise.all([loadArcolabLogo()]).then(([logo]) => {
      const img = new Image();
      img.onload = () => {
        const cw = img.naturalWidth;
        const ch = img.naturalHeight;

        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, "0");
        const mins = String(now.getMinutes()).padStart(2, "0");
        const secs = String(now.getSeconds()).padStart(2, "0");
        const dateStr = `${day} ${month} ${year}`;
        const timeStr = `${hours}:${mins}:${secs}`;

        const fontSize = Math.max(18, Math.min(32, Math.round(cw / 25)));
        const padding = Math.round(fontSize * 0.9);

        const lines: string[] = [
          `${employeeName}  |  ID: ${employeeId}`,
          `Office: ${officeName}${zoneName ? `  |  Zone: ${zoneName}` : ""}`,
          `${dateStr}  ${timeStr}`,
        ];
        if (geoLine) lines.push(geoLine);

        const logoH = Math.round(fontSize * 2.5);
        const logoW = logo.naturalWidth ? Math.round((logo.naturalWidth / logo.naturalHeight) * logoH) : logoH;
        const lineH = fontSize * 1.9;
        const stripH = padding + logoH + padding * 0.8 + lineH * lines.length + padding;

        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch + stripH;
        const ctx = canvas.getContext("2d")!;

        ctx.drawImage(img, 0, 0, cw, ch);

        const stripY = ch;
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, stripY, cw, stripH);

        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        if (logo.naturalWidth) {
          const logoX = Math.round((cw - logoW) / 2);
          const logoY = stripY + padding;
          ctx.drawImage(logo, logoX, logoY, logoW, logoH);
        }

        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";

        const textStartY = stripY + padding + logoH + padding * 0.8 + fontSize / 2;

        lines.forEach((lineText, idx) => {
          const ly = textStartY + idx * lineH;
          if (idx === 0) ctx.fillStyle = "#4ade80";
          else if (idx === 1) ctx.fillStyle = "#60a5fa";
          else if (idx === 2) ctx.fillStyle = "#ffffff";
          else ctx.fillStyle = "#fbbf24";

          const textWidth = ctx.measureText(lineText).width;
          const textX = Math.round((cw - textWidth) / 2);
          ctx.fillText(lineText, textX, ly);
        });

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = () => resolve(raw);
      img.src = base64;
    });
  });
};

import { OFFICIAL_LOCATIONS } from "@/constants/facilities";

const AUDIT_ZONES = ZONE_OPTIONS.map((key) => ZONE_KNOWLEDGE[key]?.label || key);

export default function ComparisonAnalysisPage() {
  const { employee } = useAuth();
  const [officeName, setOfficeName] = useState<string>(
    employee?.officeName || "Arcolab Corporate HQ (Bengaluru)"
  );
  const [selectedZone, setSelectedZone] = useState<string>(AUDIT_ZONES[0] || "Chemical Storage Area");

  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);

  const [beforeGeo, setBeforeGeo] = useState<GeoMeta | null>(null);
  const [afterGeo, setAfterGeo] = useState<GeoMeta | null>(null);

  const [beforeUploadTime, setBeforeUploadTime] = useState<string | undefined>();
  const [afterUploadTime, setAfterUploadTime] = useState<string | undefined>();

  const [isWatermarking, setIsWatermarking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (employee?.officeName) {
      setOfficeName(employee.officeName);
    }
  }, [employee?.officeName]);

  const { pipeline, results, analysisTimestamp, runAnalysis, reset } =
    useComparisonPipeline(officeName);

  const empName = employee?.name || "Operational Auditor";
  const empId = employee?.employeeId || "ARC100";
  const empDept = employee?.department || "Quality Assurance";

  const handleBeforeSelect = useCallback(
    async (base64: string, geo: GeoMeta | null) => {
      setBeforeGeo(geo);
      setBeforeUploadTime(new Date().toISOString());
      setIsWatermarking(true);
      try {
        const marked = await applyWatermark(base64, empName, empId, officeName, selectedZone);
        setBeforeImage(marked);
      } catch (err) {
        console.error("Failed to apply watermark to before image:", err);
        setBeforeImage(base64);
      } finally {
        setIsWatermarking(false);
      }
    },
    [empName, empId, officeName, selectedZone]
  );

  const handleAfterSelect = useCallback(
    async (base64: string, geo: GeoMeta | null) => {
      setAfterGeo(geo);
      setAfterUploadTime(new Date().toISOString());
      setIsWatermarking(true);
      try {
        const marked = await applyWatermark(base64, empName, empId, officeName, selectedZone);
        setAfterImage(marked);
      } catch (err) {
        console.error("Failed to apply watermark to after image:", err);
        setAfterImage(base64);
      } finally {
        setIsWatermarking(false);
      }
    },
    [empName, empId, officeName, selectedZone]
  );

  const handleRunAnalysis = () => {
    if (!beforeImage || !afterImage) return;
    runAnalysis(beforeImage, afterImage, beforeGeo, afterGeo);
  };

  const handleResetAll = () => {
    setBeforeImage(null);
    setAfterImage(null);
    setBeforeGeo(null);
    setAfterGeo(null);
    setBeforeUploadTime(undefined);
    setAfterUploadTime(undefined);
    reset();
  };

  const loadSamplePair = async () => {
    handleResetAll();
    setIsWatermarking(true);
    try {
      const nowIso = new Date().toISOString();
      setBeforeUploadTime(nowIso);
      setAfterUploadTime(nowIso);

      const bGeo: GeoMeta = { latitude: 12.9716, longitude: 77.5946, zone: selectedZone, capturedAt: nowIso };
      const aGeo: GeoMeta = { latitude: 12.9716, longitude: 77.5946, zone: selectedZone, capturedAt: nowIso };
      setBeforeGeo(bGeo);
      setAfterGeo(aGeo);

      const bMarked = await applyWatermark(sampleBefore, empName, empId, officeName, selectedZone);
      const aMarked = await applyWatermark(sampleAfter, empName, empId, officeName, selectedZone);

      setBeforeImage(bMarked);
      setAfterImage(aMarked);
      toast({
        title: "Sample Images Loaded",
        description: "Watermarked Before & After sample frames loaded successfully.",
      });
    } catch (err) {
      console.error("Failed to load sample images:", err);
    } finally {
      setIsWatermarking(false);
    }
  };

  const canAnalyze =
    beforeImage !== null &&
    afterImage !== null &&
    !isWatermarking &&
    pipeline.stage === "idle";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 container-max px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  <GitCompare className="h-3.5 w-3.5" />
                  <span>5S Comparison Module</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                  Workplace 5S Before / After Comparison
                </h1>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Upload baseline and post-improvement Gemba frames. Gemini Vision AI will evaluate 5S score evolution, generate comparative insights, and calculate Autonomous Lean Maintenance readiness.
                </p>
              </div>

              {/* Employee Context Widget */}
              <div className="bg-muted/40 border border-border/60 rounded-lg p-4 space-y-2 flex-shrink-0 min-w-[240px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Auditor Identity
                  </span>
                  <BadgeCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {empName}
                  </div>
                  <div className="text-muted-foreground pl-5">
                    ID: <span className="font-mono text-foreground">{empId}</span> • {empDept}
                  </div>

                  {/* Office Selection */}
                  <div className="pt-2 border-t border-border/40 mt-2">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-primary" />
                      Facility Context
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-full text-left text-xs font-medium text-primary hover:underline truncate flex items-center justify-between bg-background px-2 py-1 rounded border border-border">
                          <span className="truncate">{officeName}</span>
                          <span className="text-[10px] opacity-70 ml-1">▼</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 max-h-60 overflow-y-auto">
                        {OFFICIAL_LOCATIONS.map((loc) => (
                          <DropdownMenuItem
                            key={loc}
                            onClick={() => setOfficeName(loc)}
                            className={officeName === loc ? "font-semibold text-primary" : ""}
                          >
                            {loc}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Zone & Sample Loading Bar */}
          <div className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <span className="text-xs font-medium text-foreground whitespace-nowrap">Audit Zone:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-xs font-semibold text-primary bg-accent/50 px-2.5 py-1 rounded border border-border flex items-center gap-1.5">
                      <span>{selectedZone}</span>
                      <span className="text-[10px]">▼</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {AUDIT_ZONES.map((z) => (
                      <DropdownMenuItem
                        key={z}
                        onClick={() => setSelectedZone(z)}
                        className={selectedZone === z ? "font-semibold text-primary" : ""}
                      >
                        {z}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <button
              onClick={loadSamplePair}
              disabled={isWatermarking || pipeline.stage !== "idle"}
              className="text-xs font-medium text-primary hover:text-primary/80 inline-flex items-center gap-1.5 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-md transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Load Sample Before/After Pair
            </button>
          </div>

          {/* Dual Image Uploader Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <ImageUploader
              label="Image 1 — Before State (Baseline Gemba)"
              onImageSelect={handleBeforeSelect}
              currentImage={beforeImage}
              onClear={() => setBeforeImage(null)}
              accentColor="amber"
            />

            <ImageUploader
              label="Image 2 — After State (Post 5S Action)"
              onImageSelect={handleAfterSelect}
              currentImage={afterImage}
              onClear={() => setAfterImage(null)}
              accentColor="emerald"
            />
          </div>

          {/* Watermark Processing Notice */}
          {isWatermarking && (
            <div className="flex items-center justify-center gap-2 text-xs text-primary bg-primary/5 p-3 rounded-lg border border-primary/20 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Applying auditor metadata & security watermark to image frames…</span>
            </div>
          )}

          {/* Analysis Action Controls */}
          {pipeline.stage === "idle" && !results && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={handleRunAnalysis}
                disabled={!canAnalyze}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm shadow-md transition-all ${
                  canAnalyze
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Run 5S Comparison
              </button>

              {(beforeImage || afterImage) && (
                <button
                  onClick={handleResetAll}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm border border-input bg-background hover:bg-accent text-foreground transition-colors"
                >
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  Reset Frames
                </button>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          <ComparisonAnalysisProgress pipeline={pipeline} />

          {/* Results View */}
          {results && beforeImage && afterImage && (
            <div className="space-y-6">
              <ComparisonAnalysisResults
                data={results}
                beforeImage={beforeImage}
                afterImage={afterImage}
                analysisTimestamp={analysisTimestamp || undefined}
                beforeUploadTime={beforeUploadTime}
                afterUploadTime={afterUploadTime}
              />

              <div className="flex justify-center pt-4">
                <button
                  onClick={handleResetAll}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm border border-input bg-card hover:bg-accent text-foreground transition-colors shadow-xs"
                >
                  <RotateCcw className="h-4 w-4 text-primary" />
                  Start New 5S Comparison Audit
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
