# Olympic Distributors — website

Static site for GitHub Pages. No build step.

## Deploy
1. Create a repo (e.g. `olympicdistributors`) and push the contents of this folder to the root of the `main` branch.
2. Repo → Settings → Pages → Source: `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. Custom domain: add `olympicdistributors.ca` under Pages → Custom domain; a `CNAME` file is included. Point DNS: `A` records to GitHub Pages IPs (185.199.108.153 / .109 / .110 / .111) and `CNAME www` → `<user>.github.io`.

## Contact form
Create a free form at formspree.io, then replace `YOUR_FORM_ID` in `index.html` (the `<form action>`).

## Files
- `index.html` — page content (EN, with `data-i18n` keys)
- `i18n.js` — French copy
- `styles.css`, `script.js` — styling, nav, reveals, language toggle, form handling
- `assets/` — logos
