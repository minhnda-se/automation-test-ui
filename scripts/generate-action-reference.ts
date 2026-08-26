import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates the authoritative action keyword reference from the handler layer.
 *
 * The action list lives in utils/handlers/<X>ActionHandler.ts and nowhere else.
 * Every other consumer - the scenario validator, the docs, and any AI assistant
 * configuration - reads the files this script emits, so a handler change can
 * never silently leave a hand-maintained table behind.
 *
 * Outputs are deliberately framework files, not AI-assistant files:
 *   schema/actions.json   machine-readable, consumed by scripts/validate-scenarios.ts
 *   docs/ACTIONS.md       human-readable reference
 *
 * Inputs:
 *   utils/handlers/*.ts        the keyword list (generated, never hand-edited)
 *   schema/action-notes.json   field and behaviour text (hand-maintained)
 *
 * Usage:
 *   npm run actions:sync    regenerate schema/actions.json and docs/ACTIONS.md
 *   npm run actions:check   fail if the committed files are stale
 */

const ROOT = path.join(__dirname, '..');
const HANDLERS_DIR = path.join(ROOT, 'utils/handlers');
const NOTES_PATH = path.join(ROOT, 'schema/action-notes.json');
const OUT_JSON = path.join(ROOT, 'schema/actions.json');
const OUT_MD = path.join(ROOT, 'docs/ACTIONS.md');

const CATEGORY_ORDER = ['UI', 'Assertion', 'API', 'Network', 'Flow'];

const CATEGORY_BY_HANDLER: Record<string, string> = {
  UIActionHandler: 'UI',
  AssertActionHandler: 'Assertion',
  APIActionHandler: 'API',
  NetworkActionHandler: 'Network',
  FlowActionHandler: 'Flow',
};

interface ActionEntry {
  name: string;
  category: string;
  handler: string;
  fields: string;
  note: string;
}

interface ActionNote {
  fields: string;
  note: string;
}

function fail(message: string): never {
  console.error(`[generate-action-reference] ${message}`);
  process.exit(1);
}

function parseHandler(filePath: string): { handler: string; actions: string[] } {
  const source = fs.readFileSync(filePath, 'utf-8');

  const classMatch = source.match(/export\s+class\s+(\w+)/);
  if (!classMatch) {
    fail(`Could not find an exported class in ${path.basename(filePath)}.`);
  }
  const handler = classMatch![1];

  const actions = new Set<string>();

  // Pattern 1: private supportedActions = new Set([ 'a', 'b' ]);
  const setMatch = source.match(/supportedActions\s*=\s*new\s+Set\(\s*\[([\s\S]*?)\]\s*\)/);
  if (setMatch) {
    const literals = setMatch[1].match(/'([a-z0-9_]+)'/g) || [];
    for (const literal of literals) {
      actions.add(literal.replace(/'/g, ''));
    }
  }

  // Pattern 2: canHandle(action: string): boolean { return action === 'call_flow'; }
  const equalityMatches = source.match(/canHandle\([^)]*\)\s*:\s*boolean\s*\{[\s\S]*?\}/);
  if (equalityMatches) {
    const literals = equalityMatches[0].match(/action\s*===\s*'([a-z0-9_]+)'/g) || [];
    for (const literal of literals) {
      const name = literal.match(/'([a-z0-9_]+)'/);
      if (name) actions.add(name[1]);
    }
  }

  if (actions.size === 0) {
    fail(
      `No action keywords found in ${path.basename(filePath)}. ` +
        `This script recognises a "supportedActions = new Set([...])" property or ` +
        `an "action === '<name>'" comparison inside canHandle(). ` +
        `If the handler now declares its actions differently, update this parser - ` +
        `do not leave the reference incomplete.`
    );
  }

  return { handler, actions: Array.from(actions) };
}

function collectActions(): ActionEntry[] {
  if (!fs.existsSync(HANDLERS_DIR)) {
    fail(`Handlers directory not found: ${HANDLERS_DIR}`);
  }

  const files = fs
    .readdirSync(HANDLERS_DIR)
    .filter((file) => file.endsWith('.ts'))
    .sort();

  if (files.length === 0) {
    fail('No handler files found.');
  }

  const notes: Record<string, ActionNote> = fs.existsSync(NOTES_PATH)
    ? JSON.parse(fs.readFileSync(NOTES_PATH, 'utf-8'))
    : {};

  const entries: ActionEntry[] = [];
  const seen = new Map<string, string>();

  for (const file of files) {
    const { handler, actions } = parseHandler(path.join(HANDLERS_DIR, file));
    const category = CATEGORY_BY_HANDLER[handler];

    if (!category) {
      fail(
        `Handler "${handler}" has no category mapping. ` +
          `Add it to CATEGORY_BY_HANDLER in scripts/generate-action-reference.ts.`
      );
    }

    for (const name of actions) {
      const previous = seen.get(name);
      if (previous) {
        fail(`Action "${name}" is claimed by both ${previous} and ${handler}.`);
      }
      seen.set(name, handler);

      entries.push({
        name,
        category,
        handler,
        fields: notes[name]?.fields ?? '',
        note: notes[name]?.note ?? '',
      });
    }
  }

  // Drift trap: notes and implementation must describe the same set of actions.
  const implemented = new Set(entries.map((entry) => entry.name));
  const documented = new Set(Object.keys(notes));

  const undocumented = Array.from(implemented).filter((name) => !documented.has(name)).sort();
  const orphaned = Array.from(documented).filter((name) => !implemented.has(name)).sort();

  if (undocumented.length > 0 || orphaned.length > 0) {
    const lines: string[] = [];
    if (undocumented.length > 0) {
      lines.push(`Implemented but missing from schema/action-notes.json: ${undocumented.join(', ')}`);
    }
    if (orphaned.length > 0) {
      lines.push(`Described in schema/action-notes.json but not implemented: ${orphaned.join(', ')}`);
    }
    fail(
      `Action notes are out of sync with the handler layer.\n  ` +
        lines.join('\n  ') +
        `\n  Add or remove entries in schema/action-notes.json, then run: npm run actions:sync`
    );
  }

  entries.sort((a, b) => {
    const categoryDelta = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    return categoryDelta !== 0 ? categoryDelta : a.name.localeCompare(b.name);
  });

  return entries;
}

function buildJson(entries: ActionEntry[]): string {
  return (
    JSON.stringify(
      {
        description:
          'Generated by npm run actions:sync. Do not edit by hand. Source of truth: utils/handlers/*.ts',
        count: entries.length,
        names: entries.map((entry) => entry.name),
        actions: entries,
      },
      null,
      2
    ) + '\n'
  );
}

function buildMarkdown(entries: ActionEntry[]): string {
  const lines: string[] = [];

  lines.push('# Action Keyword Reference (generated)');
  lines.push('');
  lines.push('Do not edit this file by hand. It is generated from `utils/handlers/*.ts` by:');
  lines.push('');
  lines.push('```');
  lines.push('npm run actions:sync');
  lines.push('```');
  lines.push('');
  lines.push(
    'This file is the authoritative list of action keywords. An action that does not appear here is not implemented, whatever any other document says. Field descriptions come from `schema/action-notes.json`; the keyword list itself comes from the handler classes.'
  );
  lines.push('');
  lines.push(`Total implemented actions: ${entries.length}`);
  lines.push('');

  for (const category of CATEGORY_ORDER) {
    const inCategory = entries.filter((entry) => entry.category === category);
    if (inCategory.length === 0) continue;

    lines.push(`## ${category} (${inCategory.length})`);
    lines.push('');
    lines.push('| Action | Fields | Notes |');
    lines.push('|---|---|---|');
    for (const entry of inCategory) {
      lines.push(`| \`${entry.name}\` | ${entry.fields || '-'} | ${entry.note || '-'} |`);
    }
    lines.push('');
  }

  lines.push('## Handler map');
  lines.push('');
  lines.push('| Handler | Actions |');
  lines.push('|---|---|');
  for (const category of CATEGORY_ORDER) {
    const inCategory = entries.filter((entry) => entry.category === category);
    if (inCategory.length === 0) continue;
    lines.push(`| \`${inCategory[0].handler}\` | ${inCategory.length} |`);
  }
  lines.push('');

  return lines.join('\n');
}

function main(): void {
  const checkOnly = process.argv.includes('--check');
  const entries = collectActions();

  const json = buildJson(entries);
  const markdown = buildMarkdown(entries);

  if (checkOnly) {
    const targets: Array<[string, string]> = [
      [OUT_JSON, json],
      [OUT_MD, markdown],
    ];

    const stale = targets.filter(
      ([filePath, expected]) =>
        !fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf-8') !== expected
    );

    if (stale.length > 0) {
      fail(
        `Action reference is stale or missing:\n  ` +
          stale.map(([filePath]) => path.relative(ROOT, filePath)).join('\n  ') +
          `\n  A handler was changed without regenerating the reference. Run: npm run actions:sync`
      );
    }

    console.log(`[generate-action-reference] Action reference is up to date (${entries.length} actions).`);
    return;
  }

  for (const target of [OUT_JSON, OUT_MD]) {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  fs.writeFileSync(OUT_JSON, json);
  fs.writeFileSync(OUT_MD, markdown);

  console.log(
    `[generate-action-reference] Wrote ${entries.length} actions to schema/actions.json and docs/ACTIONS.md`
  );
}

main();
