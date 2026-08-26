import { ILocatorStore } from '../../types/scenario';

export class LocatorManager {
  private currentLocators: ILocatorStore;

  constructor(currentLocators: ILocatorStore) {
    this.currentLocators = currentLocators || {};
  }

  /**
   * Resolve a page/element reference to a selector string.
   *
   * By default an implicit `>> nth=0` is appended, which suppresses Playwright's
   * strict-mode ambiguity error. Pass `matchAll` for actions that operate on the
   * whole matched set rather than on one element - `verify_element_count` is the
   * only such action today, and the implicit index silently reduced every count
   * to 1, which made the assertion meaningless. (The blanket suffix itself is
   * Phase 13's subject; this is the narrow fix for the action it breaks outright.)
   */
  public getLocator(pageName?: string, elementName?: string, matchAll = false): string {
    if (!pageName || !elementName) return '';

    const pageLocators = this.currentLocators[pageName];
    if (!pageLocators) {
      throw new Error(`[LocatorManager] Page "${pageName}" not found in locators repository.`);
    }

    const locator = pageLocators[elementName];
    if (!locator) {
      throw new Error(`[LocatorManager] Element "${elementName}" not found in Page "${pageName}".`);
    }

    if (matchAll) return locator;

    return locator.includes('nth=') ? locator : `${locator} >> nth=0`;
  }

  public updateRuntimeLocator(pageName: string, elementName: string, newLocator: string): void {
    if (!this.currentLocators[pageName]) {
      this.currentLocators[pageName] = {};
    }
    this.currentLocators[pageName][elementName] = newLocator;
  }
}
