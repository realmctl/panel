# Admin Preview Design System

Design language for the Realm admin UI (`/admin`). Use this document when building or refactoring pages under `panel/resources/scripts/components/admin/`.

The admin area is a React SPA served at `/admin`. All new work should follow these patterns.

---

## Principles

1. **Cards, not tables** — Resource lists are row-based cards. HTML tables are deprecated for list views.
2. **Consistent density** — `rounded-md`, `px-5 py-4` headers, compact metadata on one line.
3. **Label + description + control** — Forms use `SettingRow` with a short description, not bare labels.
4. **Actions in predictable places** — Create in list header (right). Save/delete/cancel in `SettingsFooter`.
5. **No decorative empty states** — No large centered icons. One line of text + inline link.
6. **No list search** — Lists are paginated or short. Do not add search bars to list pages.
7. **Semantic tokens** — Use Tailwind theme tokens (`border-border`, `bg-card`, `text-muted-foreground`, etc.), not hard-coded grays.

---

## Architecture

```
AdminContent          ← Page title (h1) + description
  FlashMessageRender         ← Section-specific flash key
  TabNav (optional)          ← Sub-section tabs
  *Panel / *Container        ← Route content
```

| Layer | Responsibility | Example |
|-------|----------------|---------|
| `*Container.tsx` | Routing, flash key, `AdminContent` wrapper | `AdminUsersContainer.tsx` |
| `*ListPanel.tsx` | Index of resources | `UserListPanel.tsx` |
| `*CreatePanel.tsx` / `*Modal.tsx` | Create flow | `NestCreatePanel.tsx`, `MountCreateModal.tsx` |
| `*ViewPanel.tsx` / `*EditPanel.tsx` | Single resource edit or read-only detail | `UserViewPanel.tsx` |
| `*FormFields.tsx` | Reusable field groups (`SettingRow`s) | `DomainFormFields.tsx` |

**Routes:** Base path is `adminBasePath` (`/admin`) from `@/routers/adminRoutes`. Always build links as `` `${adminBasePath}/…` ``.

**Reference implementations:**

| Pattern | File |
|---------|------|
| List | `locations/LocationListPanel.tsx` |
| List + modal create | `mounts/MountListPanel.tsx`, `locations/LocationCreateModal.tsx` |
| Simple create form | `nests/NestCreatePanel.tsx` |
| Detail + related list below | `locations/LocationViewPanel.tsx` |
| Detail header + form + assignment lists | `mounts/MountViewPanel.tsx` |
| Detail with sidebar metadata | `users/UserViewPanel.tsx` (simplified single-column variant also valid) |
| Read-only info sections | `servers/ServerAboutPanel.tsx` |
| Tabbed sub-pages | `nests/EggConfigPanel.tsx` + `EggTabNav.tsx` |
| Destructive row action (icon) | `api/ApplicationApiListPanel.tsx` |
| Settings tabs | `settings/GeneralSettingsPanel.tsx` |

---

## Core primitives

Import from `@/components/admin/settings/settingsLayout` and `fieldClass.ts`.

### `SettingsSection`

Grouped card with title, description, and divided body.

```tsx
<SettingsSection title="Profile" description="Account identity and display preferences.">
  <SettingRow … />
</SettingsSection>
```

Classes: `overflow-hidden rounded-md border border-border bg-card`

### `SettingRow`

Horizontal label column + control column (stacks on mobile).

| Prop | Purpose |
|------|---------|
| `label` | Field name |
| `description` | Helper text (required) |
| `htmlFor` | Associates `<Label>` with input; omit for non-input rows |
| `wide` | Input column `md:max-w-2xl` instead of `md:max-w-xl` |
| `stacked` | Always vertical; use in narrow sidebars |

### `SettingsFooter`

Action bar for forms. Place **outside** `SettingsSection`, sibling below it.

```tsx
<SettingsFooter>
  <Button variant="outline" className="mr-auto border-destructive/50 text-destructive …">Delete</Button>
  <Link to="…"><Button variant="outline">Cancel</Button></Link>
  <Button type="submit">Save changes</Button>
</SettingsFooter>
```

- **Delete** — `mr-auto` pushes it to the left; outline + destructive colors (not filled `variant="destructive"` in footer).
- **Cancel** — Links back to list or parent resource.
- **Primary** — Rightmost; include loading text (`Saving…`, `Creating…`).

### `SegmentedControl`

Pill toggle for 2–4 mutually exclusive options (boolean, enum, protocol).

Use instead of `<select>` for Yes/No, SRV/CNAME, TCP/UDP, HTTP/HTTPS, etc.

```tsx
<SegmentedControl
  value={form.root_admin}
  options={[
    { value: false, label: 'No' },
    { value: true, label: 'Yes' },
  ]}
  onChange={(value) => updateField('root_admin', value)}
/>
```

### Field classes

From `@/components/admin/settings/fieldClass`:

| Export | Use |
|--------|-----|
| `fieldClass` | `<input>`, single-line controls |
| `textareaClass` | `<textarea>` |
| `selectClass` | Custom-styled `<select>` (e.g. with chevron) |

Do not invent new input styles. Pass `fieldClass` to inputs inside `SettingRow`.

---

## Page layout

### `AdminContent`

```tsx
<AdminContent title="Users" description="Manage panel user accounts and permissions.">
  <FlashMessageRender byKey="admin-users" className="mb-4" />
  {/* content */}
</AdminContent>
```

- Sets `document.title` to `{title} · Admin`
- Page title: `text-2xl font-header font-semibold`
- Page description: `text-sm text-muted-foreground`

### List page

```
┌─ Card ─────────────────────────────────────────────┐
│  [Title]                    [Secondary] [Create]   │  ← header, border-b
├────────────────────────────────────────────────────┤
│  Row: primary text                                   │  ← divide-y
│       metadata line (xs muted)              #id      │
│  Row …                                             │
├────────────────────────────────────────────────────┤
│  Page 1 of 3 (42 total)          [Prev] [Next]      │  ← optional pagination
└────────────────────────────────────────────────────┘
```

**Card wrapper:**

```tsx
<div className="overflow-hidden rounded-md border border-border bg-card">
```

**Header:**

```tsx
<div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h2 className="text-base font-semibold text-foreground">Users</h2>
    <p className="mt-0.5 text-sm text-muted-foreground">…</p>
  </div>
  <Button>…</Button>
</div>
```

**Row (clickable):**

```tsx
<Link className="block px-5 py-4 no-underline transition-colors hover:bg-muted/50">
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{primary}</p>
      <p className="mt-1 text-xs text-muted-foreground">{metadata}</p>
    </div>
    <code className="shrink-0 text-xs text-muted-foreground">#{id}</code>
  </div>
</Link>
```

**Row (with secondary action — no nested links):**

When a row needs both navigation and a separate link (e.g. user → servers), split into two columns:

```tsx
<div className="flex … hover:bg-muted/50">
  <Link to={detail} className="flex-1 no-underline">…</Link>
  <Link to={filter} className="text-blue-400 …">3 servers</Link>
</div>
```

Never nest `<Link>` inside `<Link>`.

**Empty state:**

```tsx
<p className="px-5 py-8 text-sm text-muted-foreground">
  No users yet.{' '}
  <Link to="…" className="text-blue-400 no-underline hover:text-blue-300">
    Create your first user
  </Link>
  .
</p>
```

### Detail / edit page

**Optional summary header** (above form) for context:

```tsx
<div className="mb-4 overflow-hidden rounded-md border border-border bg-card px-5 py-4">
  <div className="flex flex-wrap items-center gap-2">
    <h2 className="text-base font-semibold text-foreground">{name}</h2>
    {/* badges */}
  </div>
  <p className="mt-1 text-sm text-muted-foreground">email · @username · #id</p>
</div>
```

Then one or more `SettingsSection`s + `SettingsFooter`.

**Read-only UUID / long values** inside a `SettingRow`:

```tsx
<code className="block break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
  {uuid}
</code>
```

**Related resources below the form** (eggs on nest, nodes on location):

Separate card with its own header + row list, `mt-4` from the form.

### Create page

Same as edit but:

- Single `SettingsSection` titled "New …"
- `SettingsFooter` with Cancel + Create
- No summary header unless needed
- No back link — Cancel replaces it

### Modals (create / import)

Extract to `*Modal.tsx` when the list page would get heavy.

Pattern from `locations/LocationCreateModal.tsx`:

1. `Dialog` with `appearance="admin"`
2. Form with `id="create-…-form"` and `SettingRow`s
3. `Dialog.Footer` with Cancel + submit (`form="create-…-form"`)

Reset form state on close. Call `onCreated(id)` so parent can navigate or mutate SWR.

---

## Tab navigation

Use `TabNav` from `@/components/admin/TabNav`.

```tsx
const items: TabItem[] = [
  { id: 'config', label: 'Configuration', to: base, exact: true },
  { id: 'variables', label: 'Variables', to: `${base}/variables` },
];
return <TabNav items={items} />;
```

- Prefer **text-only tabs** (no icons) for admin preview sub-nav.
- Use `isActive` callback when one tab prefix would match another (e.g. subdomains domains vs records).
- `mb-6` is built into `TabNav`.
- Optional `children` slot for right-aligned actions.

---

## Read-only detail (`InfoRow`)

For about/summary pages without editable fields:

```tsx
const InfoRow = ({ label, children }) => (
  <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
    <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
    <span className="min-w-0 text-sm text-foreground sm:text-right">{children}</span>
  </div>
);
```

Use inside `SettingsSection` with `divide-y` body (same as `SettingRow` spacing).

---

## Badges & status

Inline status chips in headers or row metadata:

| Meaning | Classes |
|---------|---------|
| Admin | `bg-yellow-500/15 text-yellow-600 dark:text-yellow-500` |
| 2FA on | `bg-emerald-500/15 text-emerald-700 dark:text-emerald-400` |
| 2FA off / neutral | `bg-muted text-muted-foreground` |
| Read only | `bg-muted text-muted-foreground` |
| User mountable | `bg-blue-500/15 text-blue-600 dark:text-blue-400` |
| Maintenance | `bg-yellow-500/15 text-yellow-600 dark:text-yellow-500` |

Shape: `rounded px-1.5 py-0.5 text-xs font-medium`

---

## Links

| Context | Style |
|---------|--------|
| Inline empty-state / body links | `text-blue-400 no-underline hover:text-blue-300` |
| Row primary (inside Link) | `text-sm font-medium text-foreground` |
| Metadata links | `text-blue-400` on muted line |
| External | `target="_blank" rel="noopener noreferrer"` |

Avoid `text-primary hover:underline` (legacy table link style).

---

## Destructive actions

| Context | Pattern |
|---------|---------|
| Delete in footer | Outline button, destructive border/text, `mr-auto` |
| Delete in list row | `Button variant="ghost" size="icon"` + `Trash2` or `X`, `hover:text-destructive` |
| Confirm | `Dialog.Confirm` with `appearance="admin"` |
| Import overwrite | Outline destructive in `SettingRow` or compact section |

Do not use large red bordered cards for delete unless the action needs extended explanation.

---

## Warnings & callouts

Compact banner (no large icons):

```tsx
<p className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-muted-foreground">
  Editing eggs incorrectly can break servers. …
</p>
```

Use for nests/eggs and similar high-risk areas only.

---

## Data loading & feedback

- **Loading:** `<Spinner centered />` when `!data && isValidating`
- **Error:** `useFlash` + `clearAndAddHttpError({ key: 'admin-{section}', error })`
- **Success:** `addFlash({ key, type: 'success', title, message })`
- **Flash keys:** Match section — `admin-users`, `admin-nodes`, `admin-nests`, etc.
- **SWR keys:** `['admin-users', page]` or `admin-location-${id}`

---

## Icons (Lucide)

| Use | Icon |
|-----|------|
| Create | `Plus` |
| Save | `Save` |
| Delete (footer) | `Trash2` |
| Remove row | `X` or `Trash2` |
| Export | `Download` |
| Import | `Upload` |

Do **not** use large decorative icons in empty states. Sidebar nav icons are defined in `adminRoutes.ts` only.

---

## Overview page specifics

`AdminOverviewContainer.tsx` uses the same tokens but adds:

- Stats grid: `grid` + `divide-x divide-y` inside one card
- Quick actions / administration: row links with `ArrowUpRight` on hover
- System info: left accent bar (`w-1 bg-emerald-500` or `bg-amber-500`)

These are overview-only patterns; do not required on CRUD pages.

---

## Forms: multi-section

Large forms (eggs, nodes, settings) split into multiple `SettingsSection`s:

```tsx
<form className="space-y-4">
  <SettingsSection title="General" … />
  <SettingsSection title="Docker & startup" … />
  <SettingsFooter>…</SettingsFooter>
</form>
```

Reusable field components (`EggFormFields`, `DomainFormFields`) may render multiple `SettingsSection`s internally.

---

## Assignment lists (eggs, nodes, allocations)

Secondary cards below the main form:

- Header: title + description + `Button size="sm"` for add
- Rows: name link + metadata + remove icon button
- Add flow: `Dialog` with checkbox list in `rounded-md border border-border p-3` scroll area

---

## Pagination

```tsx
<div className="flex items-center justify-between border-t border-border px-5 py-4">
  <p className="text-sm text-muted-foreground">Page {current} of {last} ({total} total)</p>
  <div className="flex gap-2">
    <Button variant="outline" size="sm" disabled={…}>Previous</Button>
    <Button variant="outline" size="sm" disabled={…}>Next</Button>
  </div>
</div>
```

---

## Anti-patterns (do not use)

| Avoid | Use instead |
|-------|-------------|
| `adminTable` / `<table>` for lists | Row list with `divide-y` |
| `rounded-lg` on cards | `rounded-md` |
| Large icon empty states (`<Egg className="h-10 w-10" />`) | Inline text + link |
| Search on list pages | Pagination only |
| `ArrowLeft` back links | Cancel button in footer |
| Bare `Label` + `space-y-2` forms | `SettingRow` |
| `<select>` for boolean | `SegmentedControl` |
| Duplicate info (name in header AND section title) | Header for display, section for editable fields |
| Nested `<a>` / `<Link>` | Split row columns |
| `Create new` button label | `Create {resource}` (`Create user`, `Create mount`) |
| Read-only fields as disabled inputs in side column | `InfoRow` or `code` block in `SettingRow` |

---

## Checklist for new pages

- [ ] Wrapped in `AdminContent` via container
- [ ] `FlashMessageRender` with consistent `byKey`
- [ ] List uses row pattern, not table
- [ ] Create button in list header
- [ ] Forms use `SettingsSection` + `SettingRow` + `SettingsFooter`
- [ ] Inputs use `fieldClass` / `textareaClass`
- [ ] Booleans use `SegmentedControl` where appropriate
- [ ] Links use `adminBasePath`
- [ ] Empty state is one line + link
- [ ] Delete uses confirm dialog
- [ ] No search on list
- [ ] Loading spinner while fetching

---

## File checklist (new resource)

```
admin/
  Admin{Resource}Container.tsx   # routes + flash
  {resource}/
    {Resource}ListPanel.tsx
    {Resource}CreatePanel.tsx   # or {Resource}CreateModal.tsx
    {Resource}ViewPanel.tsx
    {Resource}FormFields.tsx    # optional shared fields
```

Register route in `adminRoutes.ts` and add to overview `managementSections` if appropriate.

---

## Migration note

All admin panels follow this design system. Multi-step wizards (e.g. `NodeCreatePanel`, `ServerCreatePanel`) reuse the same sidebar + `SettingsSection` pattern.
