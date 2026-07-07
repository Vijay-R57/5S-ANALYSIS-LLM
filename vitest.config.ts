import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals:     true,
    setupFiles:  ["./src/test/setup.ts"],

    // Include all test directories added in Phase 2A.2
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
    ],

    // Coverage configuration (Phase 2A.2 — run with --coverage)
    coverage: {
      provider:   "v8",
      reporter:   ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: [
        // Scoring engine (pure TS)
        "supabase/functions/analyze-5s/scoring/**/*.ts",
        // AI modules (pure TS, no Deno globals)
        "supabase/functions/analyze-5s/ai/ObservationCache.ts",
        "supabase/functions/analyze-5s/ai/RuleEngine.ts",
        "supabase/functions/analyze-5s/ai/ConsistencyValidator.ts",
        "supabase/functions/analyze-5s/ai/ReliabilityClassifier.ts",
      ],
      exclude: [
        // Exclude Deno entry point (Deno globals, not runnable in Node)
        "supabase/functions/analyze-5s/index.ts",
        // Exclude AI call files (tested via integration, not unit)
        "supabase/functions/analyze-5s/ai/VisionAnalyzer.ts",
        "supabase/functions/analyze-5s/ai/RecommendationEngine.ts",
      ],
    },
  },
  resolve: {
    alias: {
      // @  → src (React app)
      "@": path.resolve(__dirname, "./src"),
    },
    // Allow .ts extensions in imports (Deno-style imports in supabase functions)
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
});
