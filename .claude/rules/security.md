# Security

- **Never hardcode credentials, tokens, or PII** in scenario JSON, locator files, or code — use dynamic tokens (`{{RANDOM_EMAIL}}`, `{{RANDOM_STRING}}`, `{{RANDOM_PHONE}}`, `{{TIMESTAMP}}`) or environment variables instead.
- **Never commit real API keys or secrets** to `data/scenarios/`, `data/locators/`, or `.env`-style files checked into version control.
- **Base URLs and environment-specific values** (staging vs. prod endpoints) belong in configuration/environment variables, not hardcoded into `goto`/`api_*` step data.
- **Screenshots and evidence captured on assertions** may contain sensitive data rendered in the UI — be mindful of what test accounts/data expose before reports are shared externally.
- **`store_response` / runtime variables** that capture real API tokens or PII should not be logged verbatim in reports.
