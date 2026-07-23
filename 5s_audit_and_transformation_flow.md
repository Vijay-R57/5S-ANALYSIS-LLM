# ARCOLAB – Vertex AI Image Transformation Service
## Production Architecture & Implementation Specification

This document provides a comprehensive technical overview, system flowcharts, sequence diagrams, and module interaction specifications for the **ARCOLAB 5S Audit System** and the **Vertex AI Image Transformation Service**.

---

## 1. End-to-End System Overview Flowchart

```mermaid
flowchart TD
    %% Stage 1: Initiation & Inputs
    subgraph STAGE_1 ["1. Initiation & Workplace Context Capture"]
        A["User Starts Session / Selects Audit Template"] --> B["Capture Workplace Context Metadata<br/>(Area/Zone, Workspace Type, Department, Industry)"]
        B --> C["Upload Baseline Gemba Image"]
        C --> D["Pre-Validate Image<br/>(Format, Resolution, Clarity Check)"]
    end

    %% Stage 2: 5S AI Audit Engine
    subgraph STAGE_2 ["2. 5S AI Audit Engine (Gemini Vision)"]
        D --> E["Build 5S Dynamic Vision Prompt<br/>(25 Questions across 5 Pillars + Context Rules)"]
        E --> F["Call Gemini Vision Model<br/>(gemini-3.6-flash / gemini-1.5-flash)"]
        F --> G{"Strict Schema & Quality Validation"}
        G -- "Validation Failed" --> H{"Retry Attempt Available?"}
        H -- "Yes (1 Retry)" --> I["Call Fallback Vision Model<br/>(gemini-3.5-flash-lite)"] --> G
        H -- "No (Exhausted)" --> J["Error State: Audit Analysis Failed"]
        G -- "Passed Schema" --> K["Calculate Pillar & Overall 5S Scores<br/>(1-5 Rating Scale, % Compliance, Letter Grade)"]
        K --> L["Finalize Actionable Recommendations<br/>(Sort, Set in Order, Shine, Standardize, Sustain)"]
    end

    %% Stage 3: Asynchronous AI Transformation Service
    subgraph STAGE_3 ["3. AI Workplace Transformation Service (Post-Audit Enhancement)"]
        L --> M["Spawn workplaceTransformationService<br/>(Asynchronous Execution)"]
        M --> N["Generate Content Hashes<br/>(sourceImageRef, recHash, workspaceContextHash)"]
        N --> O{"Check In-Memory Cache"}
        O -- "Cache Hit (Valid)" --> P["Retrieve Cached Transformation Result"]
        O -- "Cache Miss" --> Q["Build Prompt v2.0.0 (transformationPromptBuilder.ts)<br/>(Image Editing Contract + Map Recommendations)"]
        Q --> R["POST /api/transformation<br/>(Supabase Edge Function: transform-workplace-image)"]
        R --> S["Google Cloud Vertex AI Image Editing<br/>(imagen-3.0-capability-001)"]
        S --> T["Store Transformed Image Result in Cache"]
    end

    %% Stage 4: Interactive UI & Reporting
    subgraph STAGE_4 ["4. Presentation & Interactive Output"]
        K --> U["Audit Scorecard & Radar Chart"]
        L --> V["Prioritized Corrective Action Plan"]
        P --> W["TransformationPreviewSection.tsx"]
        T --> W
        W --> X["TransformationComparisonSlider.tsx<br/>(Left: Original Gemba | Right: Vertex AI Edited Workplace)"]
        U --> Y["PDF Executive Audit Report Export"]
        V --> Y
        X --> Y
    end

    classDef primary fill:#2563eb,color:#fff,stroke:#1d4ed8;
    classDef secondary fill:#0d9488,color:#fff,stroke:#0f766e;
    classDef warning fill:#d97706,color:#fff,stroke:#b45309;
    classDef success fill:#16a34a,color:#fff,stroke:#15803d;

    class A,B,C,D primary;
    class E,F,G,I,K,L secondary;
    class M,N,O,Q,R,S,T success;
    class H,J warning;
```

---

## 2. Phase 1: 5S AI Audit Pipeline (Detailed Technical Flow)

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Auditor as User / Auditor
    participant UI as Audit Page UI (AuditPage.tsx)
    participant Pipeline as analysisPipeline.ts
    participant Questions as questions.ts
    participant Gemini as Gemini Vision API
    participant ScoreCalc as auditScoreCalculator.ts

    Auditor->>UI: Selects template & uploads baseline Gemba photo
    UI->>Pipeline: analyzeWorkplaceImage(file, context)
    Pipeline->>Questions: getAllQuestions() [25 Questions across 5 Pillars]
    Questions-->>Pipeline: Returns question schemas, ignore rules & evaluation criteria
    Pipeline->>Pipeline: buildPrompt(workspaceContext)

    rect rgb(240, 248, 255)
        note over Pipeline,Gemini: Primary Audit Analysis Execution
        Pipeline->>Gemini: POST /models/gemini-3.6-flash:generateContent
        Gemini-->>Pipeline: Raw JSON Audit Response
        Pipeline->>Pipeline: validateGeminiResponse()
    end

    alt Schema Validation Fails (Missing fields / Wrong question count)
        rect rgb(254, 242, 242)
            note over Pipeline,Gemini: Automated Single Retry Execution
            Pipeline->>Gemini: POST /models/gemini-3.5-flash-lite:generateContent
            Gemini-->>Pipeline: Retry Raw JSON Response
            Pipeline->>Pipeline: validateGeminiResponse()
        end
    end

    Pipeline->>ScoreCalc: calculateOverallScore(ratings)
    ScoreCalc-->>Pipeline: Returns numeric scores, pillar percentages, and grade label
    Pipeline-->>UI: Returns AuditAnalysisResult (Scores + Rationale + Recommendations)
```

---

## 3. Phase 2: Vertex AI Image Transformation Service

The **Post-Audit Enhancement Service** (`workplaceTransformationService.ts`) runs asynchronously after audit scoring completes. **Key Contract**: *It never alters baseline scores, ratings, or audit recommendations.*

### Edge Function Backend Contract (`transform-workplace-image/index.ts`)

- **Location**: `supabase/functions/transform-workplace-image/index.ts`
- **Method**: `POST /transform-workplace-image`
- **Input**:
  ```json
  {
    "sourceImage": "data:image/jpeg;base64,...",
    "auditId": "session_123",
    "context": { "areaName": "Assembly", "industry": "Manufacturing" },
    "recommendations": [ ... ],
    "prompt": "Edit the uploaded workplace image..."
  }
  ```
- **Output (Success)**:
  ```json
  {
    "status": "complete",
    "imageUrl": "data:image/jpeg;base64,...",
    "metadata": {
      "auditId": "session_123",
      "transformationId": "tr_edge_...",
      "imageModel": "imagen-3.0-capability-001",
      "generationStatus": "complete"
    }
  }
  ```

---

## 4. Key Architectural Safeguards & Comparison Matrix

| Feature / Aspect | 5S AI Audit Engine | AI Workplace Transformation Preview |
| :--- | :--- | :--- |
| **Execution Trigger** | Synchronous during audit run | Asynchronous post-audit enhancement |
| **Primary Responsibility** | Evaluates baseline workplace state & calculates scores | Conceptual visual forecast of post-implementation state |
| **Integrity Contract** | Dictates ratings, score cards, and recommendations | Strictly read-only relative to scoring; zero impact on grade |
| **Caching Strategy** | Session-bound audit results | Hash-based invalidation (`sourceImageRef` + `recHash` + `ctxHash`) |
| **Security Architecture** | Client API key or Edge Function | Backend API / Supabase Edge Function with Vertex AI credentials |
| **Visual Output** | Annotated pillar cards, radar chart, action list | Photorealistic visual preview with interactive comparison slider |
| **Image Identity Preservation**| Evaluates uploaded Gemba photo | Preserves 100% camera angle, room geometry, walls, and machinery |
| **Failure Handling** | Single model retry on schema validation failure | Displays explicit "Transformation Preview Unavailable" card with Retry button |

---

## 5. Primary Source File Reference

- **Audit Execution Page**: [`src/modules/audit/pages/AuditPage.tsx`](file:///c:/Users/Vijay%20Ramesh/5S/basics/frontend/src/modules/audit/pages/AuditPage.tsx)
- **AI Audit Analysis Pipeline**: [`src/modules/audit/pipeline/analysisPipeline.ts`](file:///c:/Users/Vijay%20Ramesh/5S/basics/frontend/src/modules/audit/pipeline/analysisPipeline.ts)
- **Questionnaire & Guidance Schema**: [`src/modules/audit/pipeline/questions.ts`](file:///c:/Users/Vijay%20Ramesh/5S/basics/frontend/src/modules/audit/pipeline/questions.ts)
- **Score Calculation Engine**: [`src/modules/audit/services/auditScoreCalculator.ts`](file:///c:/Users/Vijay%20Ramesh/5S/basics/frontend/src/modules/audit/services/auditScoreCalculator.ts)
- **Workplace Transformation Service**: [`src/modules/audit/services/workplaceTransformationService.ts`](file:///c:/Users/Vijay%20Ramesh/5S/basics/frontend/src/modules/audit/services/workplaceTransformationService.ts)
- **Transformation Prompt Builder**: [`src/modules/audit/services/transformationPromptBuilder.ts`](file:///c:/Users/Vijay%20Ramesh/5S/basics/frontend/src/modules/audit/services/transformationPromptBuilder.ts)
- **Backend Edge Function Service**: [`supabase/functions/transform-workplace-image/index.ts`](file:///c:/Users/Vijay%20Ramesh/5S/basics/supabase/functions/transform-workplace-image/index.ts)
- **Interactive UI Preview Section**: [`src/modules/audit/components/TransformationPreviewSection.tsx`](file:///c:/Users/Vijay%20Ramesh/5S/basics/frontend/src/modules/audit/components/TransformationPreviewSection.tsx)
- **Interactive Comparison Slider**: [`src/modules/audit/components/TransformationComparisonSlider.tsx`](file:///c:/Users/Vijay%20Ramesh/5S/basics/frontend/src/modules/audit/components/TransformationComparisonSlider.tsx)
