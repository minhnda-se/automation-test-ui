import * as path from 'path';
import * as fs from 'fs';
import { IActionHandler } from '../../types/engine';
import { IStep } from '../../types/scenario';
import { ElementHelper } from '../helpers/ElementHelper';
import { DataManager } from '../core/DataManager';

export class UIActionHandler implements IActionHandler {
  private element: ElementHelper;
  private dataManager: DataManager;

  private supportedActions = new Set([
    'goto',
    'click',
    'right_click',
    'left_click',
    'double_click',
    'hover',
    'fill',
    'clear',
    'press_key',
    'select_option',
    'check',
    'uncheck',
    'upload_file',
    'scroll_to',
    'wait',
    'wait_for_element',
    'switch_new_tab',
    'store_text',
    'save_storage_state',
  ]);

  constructor(element: ElementHelper, dataManager: DataManager) {
    this.element = element;
    this.dataManager = dataManager;
  }

  canHandle(action: string): boolean {
    return this.supportedActions.has(action);
  }

  async handle(step: IStep, locatorStr: string, resolvedData: any, _stepDesc: string): Promise<void> {
    switch (step.action) {
      case 'goto':
        await this.element.goto(resolvedData || step.url);
        break;
      case 'click':
        await this.element.click(locatorStr);
        break;
      case 'right_click':
        await this.element.rightClick(locatorStr);
        break;
      case 'left_click':
        await this.element.leftClick(locatorStr);
        break;
      case 'double_click':
        await this.element.doubleClick(locatorStr);
        break;
      case 'hover':
        await this.element.hover(locatorStr);
        break;
      case 'fill':
        await this.element.fill(locatorStr, resolvedData, step.element);
        if (step.storeAs) {
          this.dataManager.saveRuntimeVariable(step.storeAs, String(resolvedData));
        }
        break;
      case 'clear':
        await this.element.clear(locatorStr);
        break;
      case 'press_key':
        await this.element.pressKey(locatorStr, resolvedData || step.key || 'Enter');
        break;
      case 'select_option':
        await this.element.selectOption(locatorStr, resolvedData);
        break;
      case 'check':
        await this.element.check(locatorStr);
        break;
      case 'uncheck':
        await this.element.uncheck(locatorStr);
        break;
      case 'upload_file':
        await this.element.uploadFile(locatorStr, resolvedData);
        break;
      case 'scroll_to':
        await this.element.scrollTo(locatorStr);
        break;
      case 'wait':
        await this.element.wait(Number(resolvedData || step.timeout || 1000));
        break;
      case 'wait_for_element':
        await this.element.waitForElement(locatorStr, step.state, step.timeout);
        break;
      case 'switch_new_tab':
        await this.element.switchNewTab();
        break;
      case 'store_text':
        if (!step.variable) {
          throw new Error(`[Lỗi JSON]: 'store_text' bắt buộc phải khai báo trường "variable".`);
        }
        const text = await this.element.getText(locatorStr);
        this.dataManager.saveRuntimeVariable(step.variable, text);
        break;
      case 'save_storage_state': {
        const filePath = resolvedData || step.data || '.auth/user.json';
        const targetPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        await this.element.page.context().storageState({ path: targetPath });
        console.log(`[UIActionHandler] Saved auth session storageState to: ${targetPath}`);
        break;
      }
      default:
        throw new Error(`[UIActionHandler] Unhandled action: ${step.action}`);
    }
  }
}
