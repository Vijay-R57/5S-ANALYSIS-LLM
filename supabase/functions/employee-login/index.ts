// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Employee Credentials ────────────────────────────────────────────────────
// To add a new employee: copy one block below and fill in their details.
// After editing this file, redeploy the function:
//   npx supabase functions deploy employee-login --project-ref hbfwlvxeywibqmsywqgm
// ─────────────────────────────────────────────────────────────────────────────
const EMPLOYEES = [
  {
    employeeId: "ARC100",
    name: "Shankar R",
    department: "Operational Excellence",
    password: "ARCOLAB100",
  },
  {
    employeeId: "ARC101",
    name: "Naveen SV",
    department: "Operational Excellence",
    password: "ARCOLAB101",
  },
  // Guest / forker account — share these credentials with friends who fork the project
  {
    employeeId: "ARC102",
    name: "Guest User",
    department: "Operational Excellence",
    password: "ARCOLAB102",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeId, password } = await req.json();

    if (!employeeId || !password) {
      return new Response(
        JSON.stringify({ error: "Employee ID and Password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const employee = EMPLOYEES.find(
      (e) => e.employeeId === employeeId && e.password === password
    );

    if (!employee) {
      return new Response(
        JSON.stringify({ error: "Invalid Employee ID or Password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        employee: {
          employeeId: employee.employeeId,
          name: employee.name,
          department: employee.department,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
