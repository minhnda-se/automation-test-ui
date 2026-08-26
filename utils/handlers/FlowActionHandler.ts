import { IActionHandler } from '../../types/engine';
import { IStep } from '../../types/scenario';
import { FlowManager } from '../core/FlowManager';
import { DataManager } from '../core/DataManager';

export class FlowActionHandler implements IActionHandler {
  private flowManager: FlowManager;
  private dataManager: DataManager;
  private stepExecutor: (step: IStep) => Promise<void>;
  private callStackDepth = 0;
  private maxDepth = 10;

  constructor(
    flowManager: FlowManager,
    dataManager: DataManager,
    stepExecutor: (step: IStep) => Promise<void>
  ) {
    this.flowManager = flowManager;
    this.dataManager = dataManager;
    this.stepExecutor = stepExecutor;
  }

  canHandle(action: string): boolean {
    return action === 'call_flow';
  }

  async handle(step: IStep, _locatorStr: string, _resolvedData: any, _stepDesc: string): Promise<void> {
    if (!step.flow) {
      throw new Error(`[Lỗi JSON]: 'call_flow' bắt buộc phải khai báo trường "flow" (Tên file Flow).`);
    }

    if (this.callStackDepth >= this.maxDepth) {
      throw new Error(
        `[FlowActionHandler] Exceeded maximum call stack depth (${this.maxDepth}). Potential circular flow call in "${step.flow}".`
      );
    }

    const flowDef = this.flowManager.getFlow(step.flow);
    console.log(`[FlowActionHandler] Executing sub-flow: "${flowDef.flowName}" (${step.flow})`);

    // Bind passed parameters into DataManager
    if (step.params && typeof step.params === 'object') {
      for (const [paramKey, paramValue] of Object.entries(step.params)) {
        const resolvedParamValue = this.dataManager.resolve(paramValue);
        this.dataManager.saveRuntimeVariable(paramKey, String(resolvedParamValue));
      }
    }

    this.callStackDepth++;
    try {
      for (const subStep of flowDef.steps) {
        await this.stepExecutor(subStep);
      }
    } finally {
      this.callStackDepth--;
    }
  }
}
