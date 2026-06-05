/**
 * Realm design tokens — single source of truth for the client UI palette.
 * Tailwind mirrors these in tailwind.config.js under theme.extend.colors.realm.
 */
export const realmColors = {
    page: '#0b0f10',
    surface: '#0e1417',
    surfaceRaised: '#1e2d38',
    card: '#192024',
    border: '#2d3338',
    popover: '#1e2a2f',
    muted: '#64748b',
    text: '#e2e8f0',
    code: '#94a3b8',
} as const;

/** Tailwind utility groups for common Realm surfaces */
export const realmClasses = {
    page: 'bg-realm-page',
    surface: 'bg-realm-surface',
    card: 'bg-realm-card',
    border: 'border-realm-border',
    popover: 'bg-realm-popover',
    mutedText: 'text-realm-muted',
    text: 'text-realm-text',
    cardShell: 'rounded-lg overflow-hidden bg-realm-card border border-realm-border',
    cardHeader: 'bg-realm-surface border-b border-realm-border',
    tabBar: 'bg-realm-surface border border-realm-border',
    tabActive: 'bg-realm-card text-realm-text shadow-[0_1px_3px_rgba(0,0,0,0.4)]',
    tabInactive: 'text-realm-muted',
    insetPanel: 'bg-realm-surface border border-realm-border',
    code: 'bg-realm-surface text-realm-code',
    input: 'bg-realm-surface border border-realm-border text-realm-text',
    row: 'bg-realm-surface border border-realm-border',
    badge: 'bg-realm-surface-raised text-realm-muted',
} as const;
