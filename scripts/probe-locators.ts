/**
 * Locator probe - dumps the raw DOM evidence needed to resolve TODO_LOCATOR stubs.
 *
 * Config-driven. Every site-specific fact lives in the config file; this script
 * knows nothing about any particular application.
 *
 *   npm run probe-locators -- config/probe/<app>.probe.json
 *
 * Prints to stdout and writes the same text to the config's `output` path.
 *
 * Why this and not `npx playwright codegen`:
 *   - Locator files here hold plain selector strings. Codegen emits getByRole()
 *     chains that need lossy conversion; a raw attribute dump maps directly.
 *   - This dumps every attribute of every candidate at once, which is how
 *     colliding data-test values get caught. Codegen shows one element at a time.
 *   - `capture` answers behavioural questions before any test is written.
 * Codegen remains the better tool when you want to record a flow interactively.
 */
import { chromium, Locator, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { DataManager } from '../utils/core/DataManager';

interface ProbeAction {
  goto?: string;
  click?: string;
  fill?: { selector: string; value: string; secret?: boolean };
  selectOption?: { selector: string; value?: string; label?: string };
  waitForUrl?: string;
  waitForSelector?: string;
  waitForTimeout?: number;
}

interface ProbeCapture {
  name: string;
  selector?: string;
  /** url needs no selector; the rest read from the first match of `selector`. */
  value: 'text' | 'count' | 'selectedOption' | 'options' | 'url';
}

interface ProbeState {
  name: string;
  /** Run the `auth` block before this state. */
  authenticate?: boolean;
  /** Absolute URL, or a path resolved against baseUrl. */
  navigate?: string;
  actions?: ProbeAction[];
  /** Generic selectors to enumerate, e.g. ["input", "button", "[data-testid]"]. */
  dump?: string[];
  /** Run the repeated-container heuristic to find list / card / row structure. */
  structure?: boolean;
  capture?: ProbeCapture[];
}

interface ProbeConfig {
  name: string;
  baseUrl: string;
  output?: string;
  auth?: { actions: ProbeAction[]; waitForUrl?: string; waitForSelector?: string };
  states: ProbeState[];
}

const ROOT = path.join(__dirname, '..');
const dataManager = new DataManager();

const out: string[] = [];
function log(line = ''): void {
  out.push(line);
  console.log(line);
}
function section(title: string): void {
  log();
  log('='.repeat(70));
  log(title);
  log('='.repeat(70));
}

/**
 * Resolves ${ENV_VAR} from the environment, then {{TOKEN}} through DataManager so
 * the probe and the scenario runner share one token dictionary. Credentials
 * belong in the environment; the config file should carry ${VAR}, not a secret.
 */
function resolveValue(raw: string): string {
  const withEnv = raw.replace(/\$\{([A-Z0-9_]+)\}/g, (match, name: string) => {
    const value = process.env[name];
    if (value === undefined) {
      throw new Error(
        `[probe] Environment variable ${name} is referenced by the config but not set.`
      );
    }
    return value;
  });
  return String(dataManager.resolve(withEnv));
}

function isSecret(selector: string, explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit;
  return /password|passwd|pwd|token|secret/i.test(selector);
}

/**
 * Compact single-line description: tag + every attribute + trimmed text.
 *
 * Attribute values are capped because inline `src`/`srcset` data URIs run to
 * thousands of characters and bury the evidence the probe exists to surface.
 */
async function describe(element: Locator): Promise<string> {
  return element.evaluate((node: Element) => {
    const MAX_ATTR = 120;
    const attrs = Array.from(node.attributes)
      .map((a) => {
        const value =
          a.value.length > MAX_ATTR ? `${a.value.slice(0, MAX_ATTR)} [truncated]` : a.value;
        return `${a.name}="${value}"`;
      })
      .join(' ');
    const text = (node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90);
    return `<${node.tagName.toLowerCase()}${attrs ? ' ' + attrs : ''}>  text: ${JSON.stringify(text)}`;
  });
}

async function dumpSelector(page: Page, selector: string): Promise<void> {
  log();
  log(`-- ${selector} --`);

  const elements = await page.locator(selector).all();
  if (elements.length === 0) {
    log('   (nothing matched)');
    return;
  }

  const ambiguous = elements.length > 1 ? '  [ambiguous under strict mode]' : '';
  log(`   ${elements.length} match(es)${ambiguous}`);

  for (const element of elements) {
    log('  ' + (await describe(element)));

    const tag = await element.evaluate((node: Element) => node.tagName.toLowerCase());
    if (tag === 'select') {
      const options = await element.evaluate((node: Element) =>
        Array.from((node as HTMLSelectElement).options).map((o) => ({
          value: o.value,
          label: (o.textContent || '').trim(),
        }))
      );
      log('    options: ' + JSON.stringify(options));
      const parentHtml = await element.evaluate(
        (node: Element) => node.parentElement?.outerHTML || ''
      );
      log('    parent outerHTML: ' + parentHtml.replace(/\s+/g, ' ').slice(0, 600));
    }
  }
}

/**
 * Finds the deepest container whose children are a repeated, identically-classed
 * structure - the shape of a product list, a results table, a card grid. Reports
 * the container and the first child's markup so per-item selectors are read off
 * real markup instead of guessed.
 */
async function dumpStructure(page: Page): Promise<void> {
  log();
  log('-- repeated-container heuristic (list / card / row structure) --');

  const found = await page.evaluate(() => {
    const containers = Array.from(document.querySelectorAll('div, ul, tbody, section'));
    for (const candidate of containers) {
      const kids = Array.from(candidate.children);
      if (kids.length < 3) continue;
      const classes = kids.map((k) => k.className).filter(Boolean);
      if (classes.length >= 3 && new Set(classes).size === 1) {
        return {
          containerTag: candidate.tagName.toLowerCase(),
          containerClass: String(candidate.className),
          count: kids.length,
          first: kids[0].outerHTML,
        };
      }
    }
    return null;
  });

  if (!found) {
    log('   (no repeated structure found)');
    return;
  }

  log(`   <${found.containerTag} class="${found.containerClass}">  children: ${found.count}`);
  log('   first child outerHTML:');
  log('   ' + found.first.replace(/\s+/g, ' ').slice(0, 1500));
}

async function readCapture(page: Page, capture: ProbeCapture): Promise<string> {
  if (capture.value === 'url') return page.url();

  if (!capture.selector) {
    return '[probe] capture needs a "selector" unless value is "url"';
  }

  const locator = page.locator(capture.selector);

  switch (capture.value) {
    case 'count':
      return String(await locator.count());
    case 'text':
      return ((await locator.first().textContent()) || '').trim();
    case 'selectedOption':
      return locator.first().evaluate((node: Element) => {
        const select = node as HTMLSelectElement;
        return (select.options[select.selectedIndex]?.textContent || '').trim();
      });
    case 'options':
      return JSON.stringify(
        await locator
          .first()
          .evaluate((node: Element) =>
            Array.from((node as HTMLSelectElement).options).map((o) => o.value)
          )
      );
    default:
      return `[probe] unknown capture value "${capture.value}"`;
  }
}

async function runCaptures(page: Page, captures: ProbeCapture[]): Promise<void> {
  log();
  log('-- captured values --');
  for (const capture of captures) {
    log(`   ${capture.name} = ${JSON.stringify(await readCapture(page, capture))}`);
  }
}

async function runActions(page: Page, actions: ProbeAction[], baseUrl: string): Promise<void> {
  for (const action of actions) {
    if (action.goto !== undefined) {
      const url = new URL(resolveValue(action.goto), baseUrl).toString();
      log(`   goto ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
    } else if (action.click !== undefined) {
      log(`   click ${action.click}`);
      await page.locator(action.click).first().click();
    } else if (action.fill !== undefined) {
      const value = resolveValue(action.fill.value);
      const shown = isSecret(action.fill.selector, action.fill.secret) ? '***' : value;
      log(`   fill ${action.fill.selector} = ${JSON.stringify(shown)}`);
      await page.locator(action.fill.selector).first().fill(value);
    } else if (action.selectOption !== undefined) {
      const { selector, value, label } = action.selectOption;
      log(`   selectOption ${selector} -> ${JSON.stringify(value ?? label)}`);
      const target = value !== undefined ? { value } : { label: label || '' };
      await page.locator(selector).first().selectOption(target);
    } else if (action.waitForUrl !== undefined) {
      log(`   waitForUrl ${action.waitForUrl}`);
      await page.waitForURL(action.waitForUrl);
    } else if (action.waitForSelector !== undefined) {
      log(`   waitForSelector ${action.waitForSelector}`);
      await page.locator(action.waitForSelector).first().waitFor();
    } else if (action.waitForTimeout !== undefined) {
      await page.waitForTimeout(action.waitForTimeout);
    } else {
      throw new Error(`[probe] Unrecognised action: ${JSON.stringify(action)}`);
    }
  }
}

function loadConfig(configPath: string): ProbeConfig {
  const resolved = path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`[probe] Config not found: ${resolved}`);
  }

  const config = JSON.parse(fs.readFileSync(resolved, 'utf-8')) as ProbeConfig;
  if (!config.baseUrl) throw new Error('[probe] Config needs a "baseUrl".');
  if (!Array.isArray(config.states) || config.states.length === 0) {
    throw new Error('[probe] Config needs a non-empty "states" array.');
  }
  return config;
}

async function main(): Promise<void> {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error('Usage: npm run probe-locators -- <config.json>');
    console.error('Example configs live in config/probe/.');
    process.exit(1);
  }

  const config = loadConfig(configPath);
  const outputPath = path.join(ROOT, config.output || `report/fix/probe-${config.name}.txt`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    log(`Locator probe - ${config.name}`);
    log(`Base URL: ${config.baseUrl}`);
    log(`Config:   ${configPath}`);
    log(`Run at:   ${new Date().toISOString()}`);

    for (const state of config.states) {
      section(`STATE - ${state.name}`);

      if (state.authenticate) {
        if (!config.auth) {
          throw new Error(
            `[probe] State "${state.name}" sets authenticate but the config has no "auth" block.`
          );
        }
        log('-- authenticating --');
        await runActions(page, config.auth.actions, config.baseUrl);
        if (config.auth.waitForUrl) await page.waitForURL(config.auth.waitForUrl);
        if (config.auth.waitForSelector) {
          await page.locator(config.auth.waitForSelector).first().waitFor();
        }
        log('   authenticated');
      }

      if (state.navigate !== undefined) {
        const url = new URL(state.navigate, config.baseUrl).toString();
        log(`-- navigate ${url} --`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      }

      if (state.actions?.length) {
        log();
        log('-- actions --');
        await runActions(page, state.actions, config.baseUrl);
      }

      log();
      log(`URL: ${page.url()}`);

      for (const selector of state.dump || []) {
        await dumpSelector(page, selector);
      }

      if (state.structure) await dumpStructure(page);
      if (state.capture?.length) await runCaptures(page, state.capture);
    }
  } finally {
    await browser.close();
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, out.join('\n') + '\n', 'utf-8');
    console.log();
    console.log(`[probe] Written to ${path.relative(ROOT, outputPath)}`);
  }
}

main().catch((error: unknown) => {
  console.error('[probe] Failed:', error);
  process.exit(1);
});
