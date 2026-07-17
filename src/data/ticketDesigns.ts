/** Ticket design system: layout family + accent color. */

export type TicketLayoutId = 'classic' | 'boarding' | 'stub';

export type TicketAccentId =
  | 'rose'
  | 'gold'
  | 'emerald'
  | 'purple'
  | 'midnight'
  | 'ocean';

export interface TicketLayoutPreset {
  id: TicketLayoutId;
  name: string;
  description: string;
}

export interface TicketAccentPreset {
  id: TicketAccentId;
  name: string;
  accent: string;
  description: string;
}

/** @deprecated Prefer TICKET_ACCENTS — kept for older imports */
export interface TicketDesignPreset {
  id: string;
  name: string;
  accent: string;
  description: string;
}

export const TICKET_LAYOUTS: TicketLayoutPreset[] = [
  { id: 'classic', name: 'Classic', description: 'Vertical gate pass' },
  { id: 'boarding', name: 'Celebration', description: 'Wedding boarding pass' },
  { id: 'stub', name: 'Concert', description: 'Nightlife stage pass' },
];

export const TICKET_ACCENTS: TicketAccentPreset[] = [
  { id: 'rose', name: 'Coral', accent: '#d85060', description: 'Bold & energetic' },
  { id: 'gold', name: 'Mustard', accent: '#c49a1a', description: 'Warm wedding gold' },
  { id: 'emerald', name: 'Emerald', accent: '#059669', description: 'Fresh & friendly' },
  { id: 'purple', name: 'Lavender', accent: '#6d5a9a', description: 'Soft celebration tone' },
  { id: 'midnight', name: 'Midnight', accent: '#1e293b', description: 'Sleek & modern' },
  { id: 'ocean', name: 'Ocean', accent: '#0284c7', description: 'Cool & calm' },
];

/** Legacy color-only presets (same as accents) for older UI that lists TICKET_DESIGNS */
export const TICKET_DESIGNS: TicketDesignPreset[] = TICKET_ACCENTS.map((a) => ({
  id: a.id,
  name: a.name,
  accent: a.accent,
  description: a.description,
}));

const LEGACY_ACCENTS = new Set<string>(TICKET_ACCENTS.map((a) => a.id));

export function encodeTicketStyle(layout: TicketLayoutId, accent: TicketAccentId): string {
  return `${layout}-${accent}`;
}

export function parseTicketStyle(raw?: string | null): {
  layout: TicketLayoutId;
  accent: TicketAccentId;
} {
  const value = (raw || '').trim().toLowerCase();
  if (!value) return { layout: 'classic', accent: 'rose' };

  // New format: classic-rose, boarding-gold, stub-midnight
  const match = value.match(/^(classic|boarding|stub)-([a-z]+)$/);
  if (match) {
    const layout = match[1] as TicketLayoutId;
    const accentId = match[2];
    const accent = (LEGACY_ACCENTS.has(accentId) ? accentId : 'rose') as TicketAccentId;
    return { layout, accent };
  }

  // Legacy: just an accent id
  if (LEGACY_ACCENTS.has(value)) {
    return { layout: 'classic', accent: value as TicketAccentId };
  }

  return { layout: 'classic', accent: 'rose' };
}

export function getAccentPreset(id?: string | null): TicketAccentPreset {
  const parsed = parseTicketStyle(id);
  return TICKET_ACCENTS.find((a) => a.id === parsed.accent) ?? TICKET_ACCENTS[0];
}

export function getLayoutPreset(id?: string | null): TicketLayoutPreset {
  const parsed = parseTicketStyle(id);
  return TICKET_LAYOUTS.find((l) => l.id === parsed.layout) ?? TICKET_LAYOUTS[0];
}

/** @deprecated Use getAccentPreset */
export function getDesignPreset(id?: string | null): TicketDesignPreset {
  const accent = getAccentPreset(id);
  return { id: accent.id, name: accent.name, accent: accent.accent, description: accent.description };
}

export interface ResolvedTicketStyle {
  layout: TicketLayoutId;
  accentId: TicketAccentId;
  accent: string;
  sideBg: string;
  borderColor: string;
  accentTextClass: string;
  badgeLabel: string;
  styleId: string;
}

const BORDER_MAP: Record<TicketAccentId, string> = {
  rose: 'border-rose-200 dark:border-rose-900',
  gold: 'border-amber-200 dark:border-amber-900',
  emerald: 'border-emerald-200 dark:border-emerald-900',
  purple: 'border-purple-200 dark:border-purple-900',
  midnight: 'border-slate-300 dark:border-slate-700',
  ocean: 'border-sky-200 dark:border-sky-900',
};

export function resolveTicketStyle(ticketType?: {
  name?: string;
  ticketStyle?: string | null;
  accentColor?: string | null;
  badgeText?: string | null;
}): ResolvedTicketStyle {
  const { layout, accent } = parseTicketStyle(ticketType?.ticketStyle);
  const preset = TICKET_ACCENTS.find((a) => a.id === accent) ?? TICKET_ACCENTS[0];
  const accentHex = ticketType?.accentColor || preset.accent;
  const badgeLabel = ticketType?.badgeText?.trim() || ticketType?.name || 'General Admission';

  return {
    layout,
    accentId: accent,
    accent: accentHex,
    sideBg: accentHex,
    borderColor: BORDER_MAP[accent] ?? BORDER_MAP.rose,
    accentTextClass: ticketType?.accentColor ? '' : '',
    badgeLabel,
    styleId: encodeTicketStyle(layout, accent),
  };
}

/** Soft suggestion from event category — organizer can override. */
export function suggestTicketDesign(category?: string | null): {
  layout: TicketLayoutId;
  accent: TicketAccentId;
  styleId: string;
  reason: string;
} {
  const c = (category || '').toLowerCase();

  if (/wedding|formal|engagement|anniversary|birthday|bridal|reception|celebrat/.test(c)) {
    return {
      layout: 'boarding',
      accent: /birthday|rose/.test(c) ? 'rose' : 'gold',
      styleId: encodeTicketStyle('boarding', /birthday|rose/.test(c) ? 'rose' : 'gold'),
      reason: 'Celebration boarding pass suits weddings & birthdays',
    };
  }
  if (/concert|festival|nightlife|club|party|music|afrobeats/.test(c)) {
    return {
      layout: 'stub',
      accent: /nightlife|club|midnight/.test(c) ? 'midnight' : 'rose',
      styleId: encodeTicketStyle('stub', /nightlife|club|midnight/.test(c) ? 'midnight' : 'rose'),
      reason: 'Concert stage pass fits nightlife & festivals',
    };
  }
  if (/fair|expo|conference|seminar|workshop|exhibition/.test(c)) {
    return {
      layout: 'classic',
      accent: /conference|seminar|workshop/.test(c) ? 'ocean' : 'emerald',
      styleId: encodeTicketStyle(
        'classic',
        /conference|seminar|workshop/.test(c) ? 'ocean' : 'emerald'
      ),
      reason: 'Classic works well for fairs & conferences',
    };
  }

  return {
    layout: 'classic',
    accent: 'rose',
    styleId: encodeTicketStyle('classic', 'rose'),
    reason: 'Classic + Coral is a strong default',
  };
}

/** True if style still looks like an untouched default (safe to soft-replace). */
export function isDefaultTicketStyle(style?: string | null): boolean {
  if (!style) return true;
  const { layout, accent } = parseTicketStyle(style);
  return (
    (layout === 'classic' && accent === 'rose') ||
    style === 'rose' ||
    style === encodeTicketStyle('classic', 'rose')
  );
}
