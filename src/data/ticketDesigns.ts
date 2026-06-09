export interface TicketDesignPreset {
  id: string;
  name: string;
  accent: string;
  description: string;
}

export const TICKET_DESIGNS: TicketDesignPreset[] = [
  { id: 'rose', name: 'Coral', accent: '#f43f5e', description: 'Bold & energetic' },
  { id: 'gold', name: 'Gold', accent: '#eeb111', description: 'Premium VIP feel' },
  { id: 'emerald', name: 'Emerald', accent: '#10b981', description: 'Fresh & friendly' },
  { id: 'purple', name: 'Purple', accent: '#8b5cf6', description: 'Creative & vibrant' },
  { id: 'midnight', name: 'Midnight', accent: '#1e293b', description: 'Sleek & modern' },
  { id: 'ocean', name: 'Ocean', accent: '#0ea5e9', description: 'Cool & calm' },
];

export interface ResolvedTicketStyle {
  accent: string;
  sideBg: string;
  borderColor: string;
  accentTextClass: string;
  badgeLabel: string;
}

export function getDesignPreset(id?: string | null): TicketDesignPreset {
  return TICKET_DESIGNS.find((d) => d.id === id) ?? TICKET_DESIGNS[0];
}

export function resolveTicketStyle(ticketType?: {
  name?: string;
  ticketStyle?: string | null;
  accentColor?: string | null;
  badgeText?: string | null;
}): ResolvedTicketStyle {
  const preset = getDesignPreset(ticketType?.ticketStyle);
  const accent = ticketType?.accentColor || preset.accent;
  const badgeLabel = ticketType?.badgeText?.trim() || ticketType?.name || 'General Admission';

  const borderMap: Record<string, string> = {
    rose: 'border-rose-200 dark:border-rose-900',
    gold: 'border-amber-200 dark:border-amber-900',
    emerald: 'border-emerald-200 dark:border-emerald-900',
    purple: 'border-purple-200 dark:border-purple-900',
    midnight: 'border-slate-300 dark:border-slate-700',
    ocean: 'border-sky-200 dark:border-sky-900',
  };

  return {
    accent,
    sideBg: accent,
    borderColor: borderMap[preset.id] ?? borderMap.rose,
    accentTextClass: ticketType?.accentColor ? '' : `text-[${preset.accent}]`,
    badgeLabel,
  };
}
