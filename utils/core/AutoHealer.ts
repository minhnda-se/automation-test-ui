import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export class AutoHealer {
  private page: Page;
  private locatorsFilePath: string;

  constructor(page: Page, locatorFileName: string) {
    this.page = page;
    this.locatorsFilePath = path.join(__dirname, '../../data/locators', locatorFileName);
  }

  public async healLocator(
    pageName: string,
    elementName: string,
    oldLocator: string
  ): Promise<string> {
    console.log(`[AutoHealer] Attempting to heal locator: ${elementName} on ${pageName}`);

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
      this.updateLocatorFile(pageName, elementName, newLocator);
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
      throw new Error(`[AutoHealer Error]: OPENAI_API_KEY is not defined in the .env file.`);
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
        throw new Error(`OpenAI API failed with status ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const newLocator = data.choices[0].message.content.trim();

      return newLocator;
    } catch (error) {
      console.error(`[AutoHealer] Error communicating with AI service:`, error);
      return null;
    }
  }

  private updateLocatorFile(pageName: string, elementName: string, newLocator: string): void {
    const fileContent = fs.readFileSync(this.locatorsFilePath, 'utf-8');
    const locators = JSON.parse(fileContent);

    if (!locators[pageName]) {
      locators[pageName] = {};
    }

    locators[pageName][elementName] = newLocator;
    fs.writeFileSync(this.locatorsFilePath, JSON.stringify(locators, null, 2));
  }
}
