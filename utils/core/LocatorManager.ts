export class LocatorManager {
  private currentLocators: any;

  constructor(currentLocators: any) {
    this.currentLocators = currentLocators;
  }

  public getLocator(pageName?: string, elementName?: string): string {
    if (!pageName || !elementName) return '';
    const pageLocators = this.currentLocators[pageName];
    if (!pageLocators) throw new Error(`Không tìm thấy Page: ${pageName}`);

    const locator = pageLocators[elementName];
    if (!locator) throw new Error(`Không tìm thấy Locator: ${elementName} trong ${pageName}`);

    return locator.includes('nth=') ? locator : `${locator} >> nth=0`;
  }
}
