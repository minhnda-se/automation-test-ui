import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export class AutoHealer {
  private page: Page;
  private locatorsFilePath: string;

  constructor(page: Page, locatorFileName: string = 'locators.json') {
    this.page = page;
    this.locatorsFilePath = path.join(__dirname, '../../data/locators', locatorFileName);
  }

  public async healLocator(
    pageName: string,
    elementName: string,
    oldLocator: string
  ): Promise<string> {
    console.log(`[AutoHealer] Attempting to heal locator: "${elementName}" on page "${pageName}"`);

    const domSnapshot = await this.page.evaluate(() => {
      const bodyHtml = document.body.innerHTML;
      return bodyHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
        .substring(0, 8000);
    });

    const newLocator = await this.requestAIForLocator(elementName, oldLocator, domSnapshot);

    if (newLocator) {
      this.recordHealProposal(pageName, elementName, oldLocator, newLocator);
      console.log(`[AutoHealer] Successfully healed. New locator generated: ${newLocator}`);
      return newLocator;
    }

    throw new Error(`[AutoHealer] AI failed to generate a resilient locator for ${elementName}`);
  }

  private async requestAIForLocator(
    elementName: string,
    oldLocator: string,
    domSnapshot: string
  ): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn(`[AutoHealer Warning]: OPENAI_API_KEY is not defined in .env. Skipping auto-healing.`);
      return null;
    }

    const systemPrompt = `You are a QA Automation expert. The Playwright locator '${oldLocator}' for the element '${elementName}' has failed. 
Analyze the provided HTML DOM snippet and provide a new, highly resilient CSS selector.
Focus on stable attributes like data-testid, id, name, or unique classes.
Return ONLY the raw string of the new CSS selector. Do not include markdown formatting, backticks, or any explanations.`;

    console.log(`[AutoHealer] Sending HTML snippet to OpenAI for analysis...`);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: domSnapshot },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[AutoHealer Error] OpenAI API returned ${response.status}: ${errorBody}`);
        return null;
      }

      const data = (await response.json()) as any;
      const newLocator = data?.choices?.[0]?.message?.content?.trim();

      return newLocator || null;
    } catch (error) {
      console.error(`[AutoHealer Error] Failed communicating with AI service:`, error);
      return null;
    }
  }

  /**
   * Records a heal proposal as a run artifact.
   * The locator source files under data/locators are never mutated during a run:
   * a heal is a proposal for review, not a committed change.
   */
  private recordHealProposal(
    pageName: string,
    elementName: string,
    oldLocator: string,
    newLocator: string
  ): void {
    try {
      const reportDir = path.join(__dirname, '../../reports/test-results');
      const reportPath = path.join(reportDir, 'heal-report.json');

      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      let entries: any[] = [];
      if (fs.existsSync(reportPath)) {
        try {
          entries = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
          if (!Array.isArray(entries)) entries = [];
        } catch {
          entries = [];
        }
      }

      entries.push({
        timestamp: new Date().toISOString(),
        locatorFile: path.basename(this.locatorsFilePath),
        page: pageName,
        element: elementName,
        oldLocator,
        proposedLocator: newLocator,
        applied: 'runtime-only',
      });

      fs.writeFileSync(reportPath, JSON.stringify(entries, null, 2));
      console.warn(
        `[AutoHealer] Heal proposal recorded in reports/test-results/heal-report.json for "${pageName}.${elementName}". Source locator file was NOT modified.`
      );
    } catch (error) {
      console.error('[AutoHealer Error] Could not write heal report:', error);
    }
  }
}
