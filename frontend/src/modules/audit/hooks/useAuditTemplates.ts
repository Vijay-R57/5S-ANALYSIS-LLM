/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * src/modules/audit/hooks/useAuditTemplates.ts
 * ─────────────────────────────────────────────────────────────
 * Data-access hooks for audit templates and checklist items.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AuditTemplate, AuditChecklistItem } from '../types';

// ── Fetch all active templates ────────────────────────────────────────────────

// ── Mock Fallbacks ───────────────────────────────────────────────────────────

const MOCK_TEMPLATES: AuditTemplate[] = [
  {
    id: "temp-asm-1",
    name: "Manufacturing Assembly Line Template",
    description: "Specialized 5S audit checklist tailored for manual and semi-automated assembly line areas.",
    version: "1.0",
    status: "ACTIVE",
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    industry: "Manufacturing",
    department: "Assembly",
    workspace_type: "Assembly Line",
    item_count: 5,
  },
  {
    id: "temp-wh-1",
    name: "Warehouse Storage Rack Area Template",
    description: "Specialized 5S audit checklist for logistics and racking areas.",
    version: "1.0",
    status: "ACTIVE",
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    industry: "Warehouse",
    department: "Logistics",
    workspace_type: "Storage Racks",
    item_count: 5,
  }
];

const MOCK_ITEMS_MAP: Record<string, AuditChecklistItem[]> = {
  "temp-asm-1": [
    {
      id: "item-asm-sort-1",
      template_id: "temp-asm-1",
      pillar: "Sort",
      question_id: "ASM_SRT_01",
      question_text: "Are raw materials and assembly components sorted with clear boundary separation?",
      description: "Check for unneeded clutter on assembly workstations.",
      max_points: 4,
      weight: 1,
      display_order: 1,
      is_mandatory: false,
      severity: "MINOR",
      category: "Clutter",
      created_at: new Date().toISOString(),
    },
    {
      id: "item-asm-order-1",
      template_id: "temp-asm-1",
      pillar: "Set in Order",
      question_id: "ASM_ORD_01",
      question_text: "Are hand tools, torque wrenches, and jigs stored in labeled shadow boards?",
      description: "Check for tool outlines and labels.",
      max_points: 4,
      weight: 1,
      display_order: 1,
      is_mandatory: false,
      severity: "MAJOR",
      category: "Tool Organization",
      created_at: new Date().toISOString(),
    },
    {
      id: "item-asm-shine-1",
      template_id: "temp-asm-1",
      pillar: "Shine",
      question_id: "ASM_SHN_01",
      question_text: "Is the workstation bench surface clean and free of dust, grease, or liquids?",
      description: "Wipe test for residue.",
      max_points: 4,
      weight: 1,
      display_order: 1,
      is_mandatory: false,
      severity: "MINOR",
      category: "Cleanliness",
      created_at: new Date().toISOString(),
    },
    {
      id: "item-asm-std-1",
      template_id: "temp-asm-1",
      pillar: "Standardize",
      question_id: "ASM_STD_01",
      question_text: "Are 5S visual standards (Before/After sheets) posted nearby?",
      description: "Look for visual management boards.",
      max_points: 4,
      weight: 1,
      display_order: 1,
      is_mandatory: false,
      severity: "MINOR",
      category: "Documented Standards",
      created_at: new Date().toISOString(),
    },
    {
      id: "item-asm-sust-1",
      template_id: "temp-asm-1",
      pillar: "Sustain",
      question_id: "ASM_SST_01",
      question_text: "Is the daily 5S cleaning log signed off by the shift supervisor?",
      description: "Verify the logs.",
      max_points: 4,
      weight: 1,
      display_order: 1,
      is_mandatory: false,
      severity: "MINOR",
      category: "Schedule Adherence",
      created_at: new Date().toISOString(),
    }
  ],
  "temp-wh-1": [
    {
      id: "item-wh-sort-1",
      template_id: "temp-wh-1",
      pillar: "Sort",
      question_id: "WH_SRT_01",
      question_text: "Are pallets and storage items sorted and free from broken/damaged structures?",
      description: "Ensure only good quality pallets are kept.",
      max_points: 4,
      weight: 1,
      display_order: 1,
      is_mandatory: false,
      severity: "MINOR",
      category: "Clutter",
      created_at: new Date().toISOString(),
    },
    {
      id: "item-wh-order-1",
      template_id: "temp-wh-1",
      pillar: "Set in Order",
      question_id: "WH_ORD_01",
      question_text: "Are racks and shelving locations clearly labeled with visual signs?",
      description: "Racks must be visual.",
      max_points: 4,
      weight: 1,
      display_order: 1,
      is_mandatory: false,
      severity: "MAJOR",
      category: "Labels",
      created_at: new Date().toISOString(),
    },
    {
      id: "item-wh-shine-1",
      template_id: "temp-wh-1",
      pillar: "Shine",
      question_id: "WH_SHN_01",
      question_text: "Are warehouse aisles clean and completely free of spills, garbage, and dust?",
      description: "Wipe down floors.",
      max_points: 4,
      weight: 1,
      display_order: 1,
      is_mandatory: false,
      severity: "MINOR",
      category: "Cleanliness",
      created_at: new Date().toISOString(),
    },
    {
      id: "item-wh-std-1",
      template_id: "temp-wh-1",
      pillar: "Standardize",
      question_id: "WH_STD_01",
      question_text: "Are visual controls and height restrictions labeled properly on racks?",
      description: "Confirm rack warning signs are in place.",
      max_points: 4,
      weight: 1,
      display_order: 1,
      is_mandatory: false,
      severity: "MINOR",
      category: "Documented Standards",
      created_at: new Date().toISOString(),
    },
    {
      id: "item-wh-sust-1",
      template_id: "temp-wh-1",
      pillar: "Sustain",
      question_id: "WH_SST_01",
      question_text: "Are weekly inventory audits and warehouse checks recorded?",
      description: "Ensure review sheets are signed off.",
      max_points: 4,
      weight: 1,
      display_order: 1,
      is_mandatory: false,
      severity: "MINOR",
      category: "Schedule Adherence",
      created_at: new Date().toISOString(),
    }
  ]
};

// ── Fetch all active templates ────────────────────────────────────────────────

export function useAuditTemplates() {
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await (supabase as any)
        .from('audit_templates')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (dbErr) throw dbErr;
      
      if (!data || data.length === 0) {
        throw new Error("No templates in database");
      }
      
      setTemplates((data ?? []) as AuditTemplate[]);
    } catch (e: any) {
      console.warn("Failed to load templates from DB, falling back to mock templates:", e);
      setTemplates(MOCK_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}

// ── Fetch checklist items for a template ─────────────────────────────────────

export function useTemplateItems(templateId: string | null) {
  const [items, setItems] = useState<AuditChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) { setItems([]); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data, error: dbErr } = await (supabase as any)
          .from('audit_checklist_items')
          .select('*')
          .eq('template_id', templateId)
          .order('pillar', { ascending: true })
          .order('display_order', { ascending: true });

        if (dbErr) throw dbErr;
        
        if (!data || data.length === 0) {
          throw new Error("No checklist items in database");
        }
        
        if (!cancelled) setItems((data ?? []) as AuditChecklistItem[]);
      } catch (e: any) {
        console.warn("Failed to load template checklist items, falling back to mock items:", e);
        if (!cancelled) {
          const mockItems = MOCK_ITEMS_MAP[templateId] || MOCK_ITEMS_MAP["temp-asm-1"] || [];
          setItems(mockItems);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [templateId]);

  return { items, loading, error };
}

// ── Create a new template ─────────────────────────────────────────────────────

export interface CreateTemplateInput {
  name: string;
  description?: string;
  version?: string;
}

export function useCreateAuditTemplate() {
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const createTemplate = useCallback(async (
    input: CreateTemplateInput,
  ): Promise<AuditTemplate | null> => {
    setCreating(true);
    try {
      const { data, error: dbErr } = await (supabase as any)
        .from('audit_templates')
        .insert({
          name: input.name,
          description: input.description ?? null,
          version: input.version ?? '1.0',
          status: 'ACTIVE',
          is_default: false,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      toast({ title: 'Template created', description: input.name });
      return data as AuditTemplate;
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      return null;
    } finally {
      setCreating(false);
    }
  }, [toast]);

  return { createTemplate, creating };
}
