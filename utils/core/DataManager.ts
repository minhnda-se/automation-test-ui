export class DataManager {
  private runtimeVariables: Record<string, string> = {};
  private dataRow: Record<string, string>;

  constructor(dataRow: Record<string, string> = {}) {
    this.dataRow = dataRow;
  }

  public saveRuntimeVariable(key: string, value: string) {
    this.runtimeVariables[key] = value;
    console.log(`Đã lưu biến {{${key}}} = "${value}"`);
  }

  public resolve(data: any): any {
    if (typeof data !== 'string') return data;

    return data.replace(/{{\s*([^}]+)\s*}}/g, (match, keyword) => {
      const key = keyword.trim();
      if (this.runtimeVariables[key] !== undefined) return this.runtimeVariables[key];
      if (this.dataRow[key] !== undefined) return this.dataRow[key];

      switch (key) {
        case 'TIMESTAMP':
          return Date.now().toString();
        case 'RANDOM_EMAIL':
          return `qa_${Date.now()}@test.com`;
        case 'RANDOM_STRING':
          return Math.random().toString(36).substring(2, 8).toUpperCase();
        default:
          return match;
      }
    });
  }
}
