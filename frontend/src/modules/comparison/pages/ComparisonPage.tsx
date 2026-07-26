/**
 * src/modules/comparison/pages/ComparisonPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 5S Comparison & Lean Maintenance Analysis page.
 * Adapted from Arcolab/frontend/src/pages/Analysis.tsx for the main ARCOLAB app.
 *
 * Integration changes:
 *  • Uses shared AuthContext, useToast, supabase from main app (@/ aliases)
 *  • Uses shared assets from main app (arcolab-logo, sample images)
 *  • All module components/hooks imported from comparison module namespace
 *  • Removed standalone Navbar/Footer imports (handled by shared layout)
 *  • Title updated to "5S Comparison Analysis"
 *  • Logic: UNCHANGED
 */

import { useState, useCallback, useEffect } from "react";
import ImageUploader, { GeoMeta } from "@/modules/comparison/components/ImageUploader";
import AnalysisResults from "@/modules/comparison/components/AnalysisResults";
import AnalysisProgress from "@/modules/comparison/components/AnalysisProgress";
import { Loader2, Sparkles, User, BadgeCheck, Building2, MapPin, AlertTriangle, RotateCcw, ChevronDown } from "lucide-react";
import OfficeDropdown from "@/components/ui/OfficeDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useComparisonPipeline } from "@/modules/comparison/hooks/useComparisonPipeline";
import arcolabLogoSrc from "@/assets/arcolab-logo.png";
import sampleBefore from "@/assets/sample-before.jpg";
import sampleAfter from "@/assets/sample-after.jpg";

// Resize and compress image to a max dimension to speed up AI analysis
const resizeImage = (base64: string, maxDim = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const cw = Math.round(w * scale);
      const ch = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      canvas.getContext("2d")!.drawImage(img, 0, 0, cw, ch);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = base64;
  });
};

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

// Bakes employee name + office + zone + date + time (+ geo) + Arcolab logo as watermark
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
        ctx.textAlign = "center";
        const textStartY = stripY + padding + logoH + padding * 0.5;
        lines.forEach((line, i) => {
          ctx.fillText(line, cw / 2, textStartY + lineH * (i + 0.5));
        });
        ctx.textAlign = "left";

        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = base64;
    });
  });
};


const ComparisonPage = () => {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [rawBefore, setRawBefore] = useState<string | null>(null);
  const [rawAfter, setRawAfter] = useState<string | null>(null);
  const [beforeGeo, setBeforeGeo] = useState<GeoMeta | null>(null);
  const [afterGeo, setAfterGeo] = useState<GeoMeta | null>(null);
  const [beforeUploadTime, setBeforeUploadTime] = useState<string | null>(null);
  const [afterUploadTime, setAfterUploadTime] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const { toast } = useToast();
  const { employee, office } = useAuth();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const ZONES = ["Chemical Storage", "Office", "Assembly", "Production", "Warehouse", "Quality Control", "Packaging", "Maintenance"];

  const officeName = office?.name ?? "Unknown Office";
  const { pipeline, results, analysisTimestamp, runAnalysis, reset } = useComparisonPipeline(officeName);
  const loading = pipeline.stage !== "idle" && pipeline.stage !== "complete" && pipeline.stage !== "error";

  const handleLoadDemoImages = async () => {
    try {
      const urlToBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const now = new Date().toISOString();
      const mockBeforeGeo: GeoMeta = { latitude: "13.0827", longitude: "80.2707", capturedAt: now };
      const mockAfterGeo: GeoMeta = { latitude: "13.0827", longitude: "80.2707", capturedAt: now };

      const b64Before = await urlToBase64(sampleBefore);
      const b64After = await urlToBase64(sampleAfter);

      const prefixedBefore = `__geo:13.0827,80.2707:Chennai Production Area__${b64Before}`;
      const prefixedAfter = `__geo:13.0827,80.2707:Chennai Production Area__${b64After}`;

      setBeforeUploadTime(now);
      setAfterUploadTime(now);
      setBeforeGeo(mockBeforeGeo);
      setAfterGeo(mockAfterGeo);
      setRawBefore(prefixedBefore);
      setRawAfter(prefixedAfter);
      setSelectedZone("Production");

      toast({
        title: "Demo Images Loaded",
        description: "Before and After images loaded with Chennai geolocation tags. Ready to analyze.",
      });
    } catch (e) {
      console.error("Failed to load demo images:", e);
      toast({
        title: "Error loading demo images",
        description: "Failed to load static asset images. Please upload files manually.",
        variant: "destructive",
      });
    }
  };

  const handleGeoDenied = useCallback(() => {
    setGeoError("Location access is required for 5S audit compliance. Please enable location permissions and try again.");
  }, []);

  // Dynamically apply / update watermark when raw images, zone, or auth details change
  useEffect(() => {
    if (rawBefore) {
      applyWatermark(rawBefore, employee?.name ?? "Employee", employee?.employeeId ?? "", officeName, selectedZone)
        .then(setBeforeImage);
    } else {
      setBeforeImage(null);
    }
  }, [rawBefore, selectedZone, employee, officeName]);

  useEffect(() => {
    if (rawAfter) {
      applyWatermark(rawAfter, employee?.name ?? "Employee", employee?.employeeId ?? "", officeName, selectedZone)
        .then(setAfterImage);
    } else {
      setAfterImage(null);
    }
  }, [rawAfter, selectedZone, employee, officeName]);

  const handleBeforeImage = useCallback((img: string | null, geo?: GeoMeta | null) => {
    if (!img) {
      setRawBefore(null);
      setBeforeUploadTime(null);
      setBeforeGeo(null);
      return;
    }
    if (img.startsWith("__geo_denied__")) {
      setGeoError("Location access required for analysis. Please enable location and try again.");
      return;
    }
    setGeoError(null);
    setBeforeUploadTime(geo?.capturedAt ?? new Date().toISOString());
    if (geo) setBeforeGeo(geo);
    setRawBefore(img);
  }, []);

  const handleAfterImage = useCallback((img: string | null, geo?: GeoMeta | null) => {
    if (!img) {
      setRawAfter(null);
      setAfterUploadTime(null);
      setAfterGeo(null);
      return;
    }
    if (img.startsWith("__geo_denied__")) {
      setGeoError("Location access required for analysis. Please enable location and try again.");
      return;
    }
    setGeoError(null);
    setAfterUploadTime(geo?.capturedAt ?? new Date().toISOString());
    if (geo) setAfterGeo(geo);
    setRawAfter(img);
  }, []);

  const handleRunAnalysis = async () => {
    if (!beforeImage || !afterImage) {
      toast({ title: "Please upload both images", description: "Upload a before and after image to run the comparison.", variant: "destructive" });
      return;
    }
    if (!selectedZone) {
      toast({ title: "Audit Zone Required", description: "Please select an Audit Zone before running the comparison.", variant: "destructive" });
      return;
    }
    await runAnalysis(beforeImage, afterImage, beforeGeo, afterGeo, selectedZone);
  };

  const isGeoDenied = !!geoError && !beforeImage && !afterImage;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 section-padding py-8">
        <div className="container-max">
          <div className="max-w-4xl mx-auto">
            {/* Title Section */}
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-3">
                5S Comparison Analysis
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Upload before and after images of your workspace to compare 5S scores and measure improvement.
                Location is required for geotagging and audit compliance.
              </p>
              <button
                onClick={handleLoadDemoImages}
                id="btn-load-demo-images-comparison"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-secondary border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors shadow-sm animate-fade-in"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Load Demo Images (Chennai Production)
              </button>
            </div>

            {/* Session Info Card */}
            <div className="bg-card rounded-xl border border-border p-5 mb-6 shadow-sm">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-semibold">SESSION INFO</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-heading font-bold text-foreground">{employee?.name ?? "Vijay Ramesh"}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>ID: <span className="font-medium text-foreground">{employee?.employeeId ?? "ARC100"}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Dept: <span className="font-medium text-foreground">{employee?.department ?? "Operational Excellence"}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:border-l sm:border-border sm:pl-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">SELECTED OFFICE</p>
                    <OfficeDropdown />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Select Workplace Context Card */}
            <div className="bg-card rounded-xl border border-border p-5 mb-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">STEP 2</span>
                  <h3 className="text-base font-bold text-foreground">Select Workplace Context</h3>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  AUDIT ZONE <span className="text-destructive">*</span>
                </label>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between bg-background border border-input rounded-lg px-4 py-3 text-left hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors">
                      <span className={`text-sm ${selectedZone ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {selectedZone || "Select zone to compare..."}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-full min-w-[280px]">
                    {ZONES.map((zone) => (
                      <DropdownMenuItem
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className="cursor-pointer py-2.5 text-sm font-medium"
                      >
                        {zone}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Geo error banner */}
            {geoError && (
              <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Location Access Required</p>
                  <p className="text-xs text-destructive/80 mt-0.5">{geoError}</p>
                </div>
              </div>
            )}

            {/* Geotag info banner */}
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 mb-6">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">GPS geotagging is active.</span> Location, name, office, date and time will be stamped on each image.
              </p>
            </div>

            {/* Upload section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <ImageUploader
                label="Before"
                sublabel="Before Image"
                variant="before"
                image={beforeImage}
                onImageChange={handleBeforeImage}
                timestamp={beforeUploadTime}
                employeeName={employee?.name ?? "Employee"}
                officeName={officeName}
                zoneName={selectedZone || "Unspecified Zone"}
                onGeoDenied={handleGeoDenied}
              />
              <ImageUploader
                label="After"
                sublabel="After Image"
                variant="after"
                image={afterImage}
                onImageChange={handleAfterImage}
                timestamp={afterUploadTime}
                employeeName={employee?.name ?? "Employee"}
                officeName={officeName}
                zoneName={selectedZone || "Unspecified Zone"}
                onGeoDenied={handleGeoDenied}
              />
            </div>

            {/* Progress indicator */}
            <AnalysisProgress pipeline={pipeline} />

            {/* Error UI Alert Card */}
            {pipeline.stage === "error" && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center mb-8 shadow-sm animate-fade-in">
                <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-2">Comparison Failed</h3>
                <p className="text-sm font-medium text-destructive max-w-md mx-auto mb-6">
                  {pipeline.message}
                </p>
                <button
                  onClick={handleRunAnalysis}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-5 py-2.5 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors shadow-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  Retry Comparison
                </button>
              </div>
            )}

            {/* Run / Reset button row */}
            <div className="flex gap-3 mb-10">
              <button
                onClick={handleRunAnalysis}
                disabled={loading || !beforeImage || !afterImage || !selectedZone || isGeoDenied}
                className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {pipeline.message || "Analyzing workspace…"}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Run 5S Comparison
                  </>
                )}
              </button>
              {results && (
                <button
                  onClick={() => { reset(); }}
                  title="Clear results and start over"
                  className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>

            {/* Results */}
            {results && beforeImage && afterImage && (
              <AnalysisResults
                data={results}
                beforeImage={beforeImage}
                afterImage={afterImage}
                analysisTimestamp={analysisTimestamp || undefined}
                beforeUploadTime={beforeUploadTime || undefined}
                afterUploadTime={afterUploadTime || undefined}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComparisonPage;
