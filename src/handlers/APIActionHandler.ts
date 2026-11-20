import { IActionHandler } from '../types/engine';
import { IStep } from '../types/scenario';
import { APIHelper } from '../helpers/APIHelper';
import { DataManager } from '../core/DataManager';

export class APIActionHandler implements IActionHandler {
  private api: APIHelper;
  private dataManager: DataManager;

  private supportedActions = new Set(['api_post', 'api_put', 'api_patch', 'api_get', 'api_delete']);

  constructor(api: APIHelper, dataManager: DataManager) {
    this.api = api;
    this.dataManager = dataManager;
  }

  canHandle(action: string): boolean {
    return this.supportedActions.has(action);
  }

  async handle(step: IStep, _locatorStr: string, resolvedData: any, _stepDesc: string): Promise<void> {
    switch (step.action) {
      case 'api_post': {
        if (!step.url) throw new Error(`[JSON Error]: 'api_post' requires a "url" field.`);
        const postUrl = this.dataManager.resolve(step.url);
        const postRes = await this.api.post(postUrl, resolvedData, step.headers, step.expected_status);

        if (step.store_response) {
          const valueToStore = postRes[step.store_response.key];
          this.dataManager.saveRuntimeVariable(step.store_response.variable, valueToStore);
        }
        break;
      }
      case 'api_put': {
        if (!step.url) throw new Error(`[JSON Error]: 'api_put' requires a "url" field.`);
        const putUrl = this.dataManager.resolve(step.url);
        const putRes = await this.api.put(putUrl, resolvedData, step.headers, step.expected_status);

        if (step.store_response) {
          const valueToStore = putRes[step.store_response.key];
          this.dataManager.saveRuntimeVariable(step.store_response.variable, valueToStore);
        }
        break;
      }
      case 'api_patch': {
        if (!step.url) throw new Error(`[JSON Error]: 'api_patch' requires a "url" field.`);
        const patchUrl = this.dataManager.resolve(step.url);
        const patchRes = await this.api.patch(patchUrl, resolvedData, step.headers, step.expected_status);

        if (step.store_response) {
          const valueToStore = patchRes[step.store_response.key];
          this.dataManager.saveRuntimeVariable(step.store_response.variable, valueToStore);
        }
        break;
      }
      case 'api_get': {
        if (!step.url) throw new Error(`[JSON Error]: 'api_get' requires a "url" field.`);
        const getUrl = this.dataManager.resolve(step.url);
        const getRes = await this.api.get(getUrl, step.headers, step.expected_status);

        if (step.store_response) {
          const valueToStore = getRes[step.store_response.key];
          this.dataManager.saveRuntimeVariable(step.store_response.variable, valueToStore);
        }
        break;
      }
      case 'api_delete': {
        if (!step.url) throw new Error(`[JSON Error]: 'api_delete' requires a "url" field.`);
        const deleteUrl = this.dataManager.resolve(step.url);
        await this.api.delete(deleteUrl, step.headers, step.expected_status);
        break;
      }
      default:
        throw new Error(`[APIActionHandler] Unhandled API action: ${step.action}`);
    }
  }
}
