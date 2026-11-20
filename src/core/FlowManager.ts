import * as fs from 'fs';
import * as path from 'path';
import { IFlowDefinition } from '../types/scenario';

export class FlowManager {
  private static flowsCache: Map<string, IFlowDefinition> = new Map();
  private flowsDir: string;

  constructor(flowsDir?: string) {
    this.flowsDir = flowsDir || path.join(__dirname, '../../data/flows');
  }

  public getFlow(flowName: string): IFlowDefinition {
    const normalizedName = flowName.endsWith('.json') ? flowName : `${flowName}.json`;

    if (FlowManager.flowsCache.has(normalizedName)) {
      return FlowManager.flowsCache.get(normalizedName)!;
    }

    const flowPath = path.join(this.flowsDir, normalizedName);
    if (!fs.existsSync(flowPath)) {
      throw new Error(
        `[FlowManager] Flow "${flowName}" not found at: ${flowPath}. Please check data/flows directory.`
      );
    }

    try {
      const content = fs.readFileSync(flowPath, 'utf-8');
      const flowData: IFlowDefinition = JSON.parse(content);
      FlowManager.flowsCache.set(normalizedName, flowData);
      return flowData;
    } catch (error: any) {
      throw new Error(`[FlowManager] Failed to parse flow JSON "${flowName}": ${error.message}`);
    }
  }

  public clearCache(): void {
    FlowManager.flowsCache.clear();
  }
}
