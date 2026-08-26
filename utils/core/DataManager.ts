import { IDataRow } from '../../types/scenario';

export class DataManager {
  private runtimeVariables: Record<string, string> = {};
  private dataRow: IDataRow;

  constructor(dataRow: IDataRow = {}) {
    this.dataRow = dataRow;
  }

  public saveRuntimeVariable(key: string, value: string) {
    this.runtimeVariables[key] = value;
    console.log(`[DataManager] Saved runtime variable {{${key}}} = "${value}"`);
  }

  public getRuntimeVariable(key: string): string | undefined {
    return this.runtimeVariables[key];
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
        case 'RANDOM_PHONE':
          return `09${Math.floor(10000000 + Math.random() * 90000000)}`;
        case 'UUID':
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        case 'DATE_TODAY':
          return new Date().toISOString().split('T')[0];
        case 'RANDOM_NUMBER':
          return Math.floor(1000 + Math.random() * 9000).toString();
        default:
          return match;
      }
    });
  }
}
