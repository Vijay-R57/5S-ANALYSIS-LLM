import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REMOTE_SUPABASE_URL = "https://xzcjkeycqeeezdjqocjp.supabase.co";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  console.log(`[Gateway] ${req.method} ${path}`);

  // Handle preflight CORS requests globally or forward them
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  let targetUrl = "";

  if (path.startsWith("/functions/v1/employee-login")) {
    targetUrl = `http://localhost:8001${path.replace("/functions/v1/employee-login", "") || "/"}${url.search}`;
  } else if (path.startsWith("/functions/v1/analyze-5s")) {
    targetUrl = `http://localhost:8002${path.replace("/functions/v1/analyze-5s", "") || "/"}${url.search}`;
  } else if (path.startsWith("/functions/v1/save-analysis-log")) {
    targetUrl = `http://localhost:8003${path.replace("/functions/v1/save-analysis-log", "") || "/"}${url.search}`;
  } else {
    // Forward to remote Supabase
    targetUrl = `${REMOTE_SUPABASE_URL}${path}${url.search}`;
  }

  console.log(`[Gateway] Proxying to: ${targetUrl}`);

  try {
    const headers = new Headers(req.headers);
    // Overwrite Host header for the remote Supabase router
    if (targetUrl.startsWith(REMOTE_SUPABASE_URL)) {
      headers.set("host", "xzcjkeycqeeezdjqocjp.supabase.co");
    }

    // Keep request body if present and method is not GET/HEAD
    const hasBody = req.method !== "GET" && req.method !== "HEAD" && req.body;
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: hasBody ? req.body : null,
      redirect: "manual",
    });

    // Create a new response with original headers but add CORS headers to be safe
    const resHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, val]) => {
      resHeaders.set(key, val);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error(`[Gateway] Proxy error:`, err);
    return new Response(
      JSON.stringify({ error: `Gateway proxy failed: ${err.message}` }),
      {
        status: 502,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}, { port: 54321 });
