import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useAuth, Office } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Facility {
  id: string;
  name: string;
  city: string;
  country: string;
  letter?: string;
}

export const FACILITY_LIST: Facility[] = [
  { id: "off-001", name: "Arcolab Corporate HQ (Bengaluru)", city: "Bengaluru", country: "India", letter: "A" },
  { id: "off-002", name: "Arcolab R&D Center (Bengaluru)", city: "Bengaluru", country: "India", letter: "A" },
  { id: "off-003", name: "Strides Global Formulation Facility (KBS)", city: "Bengaluru", country: "India", letter: "S" },
  { id: "off-004", name: "Strides Biotech Manufacturing Unit (KBS)", city: "Bengaluru", country: "India", letter: "S" },
  { id: "off-005", name: "Arcolab Quality Control Center", city: "Bengaluru", country: "India", letter: "A" },
  { id: "off-006", name: "Arcolab Analytical Testing Lab (KBS)", city: "Bengaluru", country: "India", letter: "A" },
  { id: "off-007", name: "Strides Oral Solid Dosage Facility (USFDA Approved)", city: "Bengaluru", country: "India", letter: "S" },
];

export const OfficeDropdown: React.FC = () => {
  const { office, setOfficeState } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOfficeName = office?.name || FACILITY_LIST[0].name;

  useEffect(() => {
    // If no office set yet, initialize default
    if (!office) {
      const defaultFac = FACILITY_LIST[0];
      setOfficeState({
        id: defaultFac.id,
        name: defaultFac.name,
        short: defaultFac.name.split(" ")[0],
      });
    }
  }, [office, setOfficeState]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFacility = async (facility: Facility) => {
    setIsOpen(false);
    const newOffice: Office = {
      id: facility.id,
      name: facility.name,
      short: facility.name.split(" ")[0],
    };
    setOfficeState(newOffice);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles" as unknown as "profiles")
          .update({ office_id: facility.id })
          .eq("id", user.id);
      }
    } catch (err) {
      console.warn("Notice updating profile office assignment:", err);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-card hover:bg-accent/40 border border-input rounded-lg text-xs sm:text-sm font-semibold text-[#1f4e38] dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-xs cursor-pointer"
      >
        <span className="truncate max-w-[200px] sm:max-w-[280px]">{selectedOfficeName}</span>
        <ChevronDown className={`h-4 w-4 text-[#1f4e38] dark:text-emerald-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 mt-2 w-72 sm:w-80 rounded-xl bg-card border border-border shadow-xl ring-1 ring-black/5 z-50 overflow-hidden py-1 max-h-72 overflow-y-auto">
          {FACILITY_LIST.map((fac) => {
            const isSelected = fac.name === selectedOfficeName;
            return (
              <button
                key={fac.id}
                type="button"
                onClick={() => handleSelectFacility(fac)}
                className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between ${
                  isSelected
                    ? "bg-[#1f4e38] text-white font-semibold"
                    : "text-foreground hover:bg-accent/60"
                }`}
              >
                <span className="truncate pr-2">{fac.name}</span>
                {isSelected && <Check className="h-4 w-4 text-white flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OfficeDropdown;
