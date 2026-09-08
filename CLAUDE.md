# Glucose Insights Website

Marketing site for the Glucose Insights app: CGM analytics for athletes with Type 1 diabetes. Static HTML/CSS/JS, hosted on Netlify (`netlify.toml`).

## Brand
The brand lives in the vault: `~/business-os/projects/glucose-insights/brand.md`. Colour tokens come from the app's `Theme.swift`. Do not keep a second palette or style guide in this repo. The parked branch `redesign-bevel-light` still carries the old style guide, wireframes and a stale CLAUDE.md; ignore them.

## Pages
- `index.html` — homepage, built with the scroll-craft engine (`scrollcraft.js`, `scrollcraft.css`, unmodified) plus page-local code. Data for the run trace in `assets/malaga.json`.
- `blog.html`, `blog/` — articles
- `support.html`, `privacy-policy.html`, `terms-conditions.html`
- The secondary pages share `css/site.css` (tokens, the fixed bar, the footer). Their own layout CSS stays inline; the legacy `--slate`/`--sand`/`--accent` names are remapped there onto paper and ink.
- Legacy Webflow pages (`about`, `log-in`, `sign-up`, `401`, `404`, etc.) are noindexed and untouched.

## Working on it
- Process: the `premium-site` skill (seven steps, wraps scroll-craft). Build folders live in `~/repos/scrollcraft-workspace` (see `.scrollcraft.json`).
- Subscribe forms post to Mailchimp via `js/subscribe.js`; keep the `.subscribe-form` class.
- Analytics tag, JSON-LD and OG tags in `index.html` head; carry them over on any rebuild.
- Other pages link to `index.html#features`; keep that anchor.
