# Changelog

All notable public changes to this project are documented in this file.
Detailed internal fix reports and daily task logs are stored locally under gitignored `docs/internal/` and `plan/daily/`.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed (Phase 0 - Project Restructuring & Standardization)
- Consolidated runtime source code under `src/` (`src/core/`, `src/handlers/`, `src/helpers/`, `src/types/`) and updated all script, test, and schema generation paths (`RESTRUCT-01`).
- Unified all runtime test, trace, Allure, Playwright HTML, AutoHealer proposal, and DOM probe outputs under a single gitignored `reports/` directory (`RESTRUCT-02`).
- Moved CSV scenario sources into `data/csv/` and updated `scripts/csv-to-json.ts` default lookup to `data/csv/` while preserving explicit path support (`RESTRUCT-02`).
- Archived internal fix reports, planning notes, and spec files under gitignored `docs/internal/` and simplified `.gitignore` (`RESTRUCT-02`).
- Standardized tooling configuration: aligned `.editorconfig` (`indent_size = 2`) with `.prettierrc`, cleaned up `playwright.config.ts` (bundled `chromium` default with `PW_CHANNEL`, `SLOW_MO`, and `WORKERS` env overrides, plus `allure-playwright` v3 `resultsDir`), updated `package.json` scripts (`test:coded`, `clean`, unified `reports/` Allure paths), optimized CI browser install to `chromium`, and documented optional env vars in `.env.example` (`RESTRUCT-03`).
- Rewrote `README.md` (concise, pure ASCII English, zero icons) and realigned `docs/NEW_USER_GUIDE.md`, `GEMINI.md`, and `.claude/` instructions with the `src/`, `data/csv/`, and `reports/` structure (`RESTRUCT-04`).

## [1.10.0] - 2026-08-27

### Added
- Single-source generated action keyword catalog (`schema/actions.json`, `docs/ACTIONS.md`, `schema/scenario-schema.json` enum, and `src/types/actions.generated.ts`) enforced by `npm run actions:check`.
- Static scenario and flow validation gate (`npm run validate`, `npm run validate:wip`) enforcing English-only authored text, mandatory assertions (`verify_*`), and `wip` suite lifecycle status.
- Offline framework guard suites under `tests/framework/` (52 tests, no external network required).
- Config-driven DOM locator probe CLI (`npm run probe-locators`).
- `clear`, `verify_unchecked`, `verify_value`, and `expected_status` support on API actions.
