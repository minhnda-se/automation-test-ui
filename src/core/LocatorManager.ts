import { ILocatorStore } from '../types/scenario';

export class LocatorManager {
  private currentLocators: ILocatorStore;

  constructor(currentLocators: ILocatorStore) {
    this.currentLocators = currentLocators || {};
  }

  /**
   * Resolve a page/element reference to a selector string.
   *
   * Returns the selector exactly as written. Nothing is appended: an ambiguous
   * selector must reach Playwright ambiguous so strict mode can reject it, which
   * is the only runtime signal that a locator is bound to the wrong element. A
   * locator that legitimately targets one of several matches says so itself with
   * an explicit `>> nth=`.
   */
  public getLocator(pageName?: string, elementName?: string): string {
    if (!pageName || !elementName) return '';

    const pageLocators = this.currentLocators[pageName];
    if (!pageLocators) {
      throw new Error(`[LocatorManager] Page "${pageName}" not found in locators repository.`);
    }

    const locator = pageLocators[elementName];
    if (!locator) {
      throw new Error(`[LocatorManager] Element "${elementName}" not found in Page "${pageName}".`);
    }

    return locator;
  }

  public updateRuntimeLocator(pageName: string, elementName: string, newLocator: string): void {
    if (!this.currentLocators[pageName]) {
      this.currentLocators[pageName] = {};
    }
    this.currentLocators[pageName][elementName] = newLocator;
  }
}
