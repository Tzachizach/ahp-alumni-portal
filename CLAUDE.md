# AHP Alumni Portal — Claude developer notes

A private alumni portal for The Ohio State University Accounting Honors
Program. Next.js 14 (App Router, TypeScript) + Tailwind + NextAuth + Airtable.

## Where things live

- **Production:** https://ahp-alumni-portal.vercel.app
- **GitHub:** https://github.com/Tzachizach/ahp-alumni-portal
- **Deploy:** `git push` to `main` — Vercel auto-builds in ~1 minute. No
  separate deploy step. No committed `package-lock.json`; Vercel installs
  fresh from `package.json`.
- **No local preview server is set up.** Ship by committing and pushing;
  verify behavior on the deployed Vercel URL. Don't try to `npm run dev`
  in this session unless the user explicitly asks.

## Data model — the One Big Thing

There is **one Airtable People table** (named "Alumni" for historical
reasons, table id `tbleYhQvDO4t1bdIv` in base `app0CHyAhgaS62gyA`) with a
**`Type` single-select** field: Alumni / Faculty / Student. Everything on
the website is rendered conditionally on this field — *don't* introduce
separate tables for faculty or students.

- Defaults to 'Alumni' in the code if Type is blank (defensive fallback in
  `mapAlumni`).
- `Imposter` checkbox — true means "hide from website entirely". Applied
  at the data layer in `lib/airtable.ts` so every downstream consumer
  inherits the exclusion.

## AI fields

Several Airtable fields are AI-computed and return objects shaped like
`{state, value, isStale}`, not plain strings. The `str()` helper in
`lib/airtable.ts` unwraps them — call it instead of `String()`.

The PATCH route in `app/api/alumni/[id]/route.ts` has a denylist of fields
that must never be written to: AI fields plus `Type` and `Imposter`. If
you add a new AI field, add it to that set.

## React quirks worth knowing

- **Render helpers, not nested components.** `renderInput` /
  `renderTextarea` / `renderReadOnly` in `app/(dashboard)/profile/me/page.tsx`
  are *functions returning JSX*, not React components. Defining a component
  inside a parent causes it to unmount on every keystroke (focus loss).
  Don't refactor these into components.
- **Stretched-link pattern** in `AlumniCard.tsx` — the whole card is
  clickable via a `::before` pseudo-element on the name `<Link>`. Other
  interactive children need `relative z-10` to remain clickable above the
  stretched area. The card itself is `<article>`, not a wrapper anchor.
- **Focus trap** for modals/drawers lives in `lib/useFocusTrap.ts`. Re-uses
  `containerRef.current` *inside* the keydown closure because TS doesn't
  preserve outer narrowing across closure boundaries.
- **`react-simple-maps`** is loaded via `next/dynamic` with `ssr: false`
  because it touches `window` at import.
- **`mustChangePassword` middleware** in `middleware.ts` force-redirects to
  `/profile/change-password` until the flag is cleared. Exempts `/api/*`
  and the change-password page itself.

## Accessibility

WCAG 2.1 AA Stages 1–3 already shipped. The site should pass a static
audit. Stage 4 (more `autoComplete`, opacity-color polish) is optional.
See `~/Vicious Syndicate Dropbox/Tzachi Zach/CLAUDE COWORK/CLAUDE OUTPUTS/ahp-portal-wcag-audit.md`
for the original audit findings.

## When proposing changes

1. Stay role-aware — every render decision should check `alumni.type`
   where applicable. Alumni-only stats (completeness bar, class
   breakdown, top employers) should explicitly filter to
   `type === 'Alumni'`.
2. Stay data-layer-first — Imposter filtering, default-to-Alumni, AI field
   unwrapping all happen in `lib/airtable.ts` and shouldn't be re-done in
   pages.
3. Stay accessible — wire `aria-label` on icon-only buttons, `htmlFor`/`id`
   on label-input pairs, add new content into the existing role=dialog /
   aria-expanded patterns.
4. Stay shippable — Vercel will type-check on build. TS errors break the
   deploy. If unsure, sanity-check by reading the related files.

## Full status

For comprehensive context — what's built, what's paused, what's
outstanding, recent decisions — read:

```
~/Vicious Syndicate Dropbox/Tzachi Zach/CLAUDE COWORK/CLAUDE OUTPUTS/AHP Alumni Portal/project-status.md
```
