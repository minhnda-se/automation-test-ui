export class LocatorManager {
  private currentLocators: any;

  constructor(currentLocators: any) {
    this.currentLocators = currentLocators;
  }

  public getLocator(pageName?: string, elementName?: string): string {
    if (!pageName || !elementName) return '';
    // // ---- ĐOẠN LOG DEBUG ----
    // console.log(
    //   `\n[DEBUG-LOCATOR] Đang tìm kiếm: Page = "${pageName}" | Element = "${elementName}"`
    // );
    // console.log(
    //   `[DEBUG-LOCATOR] Các Page hiện có trong bộ nhớ:`,
    //   Object.keys(this.currentLocators)
    // );

    // if (this.currentLocators[pageName]) {
    //   console.log(
    //     `[DEBUG-LOCATOR] Các Element có trong ${pageName}:`,
    //     Object.keys(this.currentLocators[pageName])
    //   );
    //   console.log(
    //     `[DEBUG-LOCATOR] Giá trị thực tế của ${elementName}:`,
    //     this.currentLocators[pageName][elementName]
    //   );
    // } else {
    //   console.log(
    //     `[DEBUG-LOCATOR] CẢNH BÁO: Không tìm thấy object page ${pageName} trong biến this.currentLocators`
    //   );
    // }
    // // ------------------------
    const pageLocators = this.currentLocators[pageName];

    if (!pageLocators) throw new Error(`Không tìm thấy Page: ${pageName}`);

    const locator = pageLocators[elementName];
    if (!locator) throw new Error(`Không tìm thấy Locator: ${elementName} trong ${pageName}`);

    return locator.includes('nth=') ? locator : `${locator} >> nth=0`;
  }

  public updateRuntimeLocator(pageName: string, elementName: string, newLocator: string) {
    this.currentLocators[pageName][elementName] = newLocator;
  }
}
