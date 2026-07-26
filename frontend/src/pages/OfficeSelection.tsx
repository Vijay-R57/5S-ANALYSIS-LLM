import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DBOffice {
  id: string;
  name: string;
  city: string;
  country: string;
  letter: string;
  titleLines: string[];
}

const DEFAULT_OFFICES: DBOffice[] = [
  {
    id: "off-001",
    name: "Arcolab Corporate HQ (Bengaluru)",
    city: "Bengaluru",
    country: "India",
    letter: "A",
    titleLines: ["Arcolab Corporate HQ", "(Bengaluru)"],
  },
  {
    id: "off-002",
    name: "Arcolab R&D Center (Bengaluru)",
    city: "Bengaluru",
    country: "India",
    letter: "A",
    titleLines: ["Arcolab R&D Center", "(Bengaluru)"],
  },
  {
    id: "off-003",
    name: "Strides Global Formulation Facility (KBS)",
    city: "Bengaluru",
    country: "India",
    letter: "S",
    titleLines: ["Strides Global", "Formulation Facility", "(KBS)"],
  },
  {
    id: "off-004",
    name: "Strides Biotech Manufacturing Unit (KBS)",
    city: "Bengaluru",
    country: "India",
    letter: "S",
    titleLines: ["Strides Biotech", "Manufacturing Unit", "(KBS)"],
  },
  {
    id: "off-005",
    name: "Arcolab Quality Control Center",
    city: "Bengaluru",
    country: "India",
    letter: "A",
    titleLines: ["Arcolab Quality Control", "Center"],
  },
];

const OfficeSelection = () => {
  const navigate = useNavigate();
  const { employee, setOfficeState, isAuthenticated, office: currentOffice } = useAuth();
  const [offices] = useState<DBOffice[]>(DEFAULT_OFFICES);
  const [loading] = useState(false);
  const [error] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleSelect = async (off: DBOffice) => {
    if (!employee) return;
    
    try {
      setUpdating(off.id);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles" as unknown as "profiles")
          .update({ office_id: off.id })
          .eq("id", user.id);
      }
    } catch (err: unknown) {
      console.warn("Notice updating profile office assignment:", err);
    } finally {
      setOfficeState({
        id: off.id,
        name: off.name,
        short: off.name.split(" ")[0],
      });
      navigate("/analysis");
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 section-padding py-12">
        <div className="container-max max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Header */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 mb-5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Check-In</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-3">
                Select Your Office
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
                Choose your facility below to begin your workplace analysis check-in.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-4 mb-8 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}

            {/* Office Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading facilities...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto items-stretch">
                {offices.map((off) => {
                  const isSelected = currentOffice?.id === off.id || updating === off.id;
                  return (
                    <button
                      key={off.id}
                      onClick={() => handleSelect(off)}
                      disabled={updating !== null}
                      className={`group relative flex flex-col items-center justify-between p-6 sm:p-7 rounded-2xl border transition-all text-center disabled:opacity-50 ${
                        isSelected
                          ? "border-[#1f4e38] ring-2 ring-[#1f4e38]/30 shadow-md bg-card"
                          : "border-[#d0e1d4] dark:border-emerald-900/40 bg-card hover:border-[#1f4e38]/60 hover:shadow-md"
                      }`}
                    >
                      <div className="flex flex-col items-center w-full">
                        {/* Initial Box Icon */}
                        <div className="w-16 h-16 rounded-2xl bg-[#e3eee6] dark:bg-emerald-950/40 border border-[#cbe0d3] dark:border-emerald-800/40 flex items-center justify-center mb-5 shadow-xs transition-transform group-hover:scale-105">
                          <span className="font-serif text-3xl font-bold text-[#1f4e38] dark:text-emerald-400">
                            {off.letter}
                          </span>
                        </div>

                        {/* Title Lines */}
                        <h3 className="font-serif text-base sm:text-lg font-bold text-foreground leading-snug text-center mb-1">
                          {off.titleLines.map((line, idx) => (
                            <span key={idx} className="block">
                              {line}
                            </span>
                          ))}
                        </h3>

                        {/* Location */}
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          {off.city}, {off.country}
                        </p>
                      </div>

                      {/* Pill Badge at Bottom */}
                      <div className="mt-6 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#e3eee6] dark:bg-emerald-950/50 text-[#1f4e38] dark:text-emerald-300 text-xs font-medium">
                        {updating === off.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1f4e38]" />
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1f4e38] dark:bg-emerald-400"></span>
                            Check In
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-10">
              Your selection will be recorded with your analysis for audit purposes.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OfficeSelection;

