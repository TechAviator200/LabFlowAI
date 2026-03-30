# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in LabFlow AI, please **do not open a public GitHub issue**. Instead, email the maintainers directly (add contact info here) or use GitHub's private security advisory feature.

We aim to respond within **5 business days** and resolve confirmed vulnerabilities within **30 days**.

---

## Secret Hygiene Rules

### Never commit secrets

The following must **never** be committed to this repository:

| Secret | Where it lives |
|---|---|
| `SUPABASE_SERVICE_KEY` | `backend/.env` only — never in frontend code |
| `LLM_API_KEY` | `backend/.env` only — never in frontend code |
| `SECRET_KEY` | `backend/.env` only |
| Any API key, token, or password | `.env` files only, listed in `.gitignore` |

### How we separate backend and frontend secrets

```
Frontend (browser-visible)         Backend (server-only)
──────────────────────────         ──────────────────────
NEXT_PUBLIC_API_URL ✅             SUPABASE_SERVICE_KEY 🔒
                                   LLM_API_KEY          🔒
                                   SECRET_KEY           🔒
```

`NEXT_PUBLIC_*` variables are **embedded in the client bundle** and visible to anyone. Never prefix a secret with `NEXT_PUBLIC_`.

### .env files

- `.env.example` — committed, contains only placeholders (no real values)
- `.env` / `.env.local` / `.env.production` — **never committed**, listed in `.gitignore`

---

## Safe Practices

### For contributors

1. Run `git diff --staged` before every commit — verify no secrets are staged
2. Use `gitleaks detect` locally before pushing (see CI section)
3. Never hardcode API keys, tokens, or credentials in source code
4. Never log secret values — use `***` masking in log output

### For deployment

1. Set all secrets via your hosting platform's environment variable UI (Render, Vercel, etc.)
2. Use the minimum required permissions for each credential
3. Rotate `SUPABASE_SERVICE_KEY` and `LLM_API_KEY` if you suspect exposure
4. Set `SECRET_KEY` to a randomly generated 32+ character string in production

### Key separation

- `SUPABASE_SERVICE_KEY` (service role) bypasses row-level security — keep it server-side only
- The frontend only calls `/api/*` which proxies through Next.js rewrites — the backend URL is hidden from the browser
- LLM API keys are never exposed to the frontend

---

## CI Security Checks

Every push and pull request runs:

| Check | Tool | What it finds |
|---|---|---|
| Python CVEs | `pip-audit` | Known vulnerabilities in dependencies |
| Python static analysis | `bandit` | Hardcoded passwords, shell injection, etc. |
| Node CVEs | `npm audit` | Known vulnerabilities in JS dependencies |
| Secret detection | `gitleaks` | Accidentally committed secrets |

---

## What LabFlow AI Does NOT Do

- Does not process patient data, clinical records, or personally identifiable health information
- Does not make autonomous decisions — all AI outputs require human review
- Is not validated for GxP, FDA, EMA, ISO 13485, or any regulatory framework
- Does not store or transmit raw user-uploaded files to third parties beyond configured LLM APIs

---

## Dependency Updates

Dependencies are pinned in `requirements.txt` and `package.json`. Run `pip-audit` and `npm audit` regularly to check for new CVEs. Update pinned versions promptly when vulnerabilities are found.
