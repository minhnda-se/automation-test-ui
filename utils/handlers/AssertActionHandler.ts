import { IActionHandler } from '../../types/engine';
import { IStep } from '../../types/scenario';
import { AssertHelper } from '../helpers/AssertHelper';

export class AssertActionHandler implements IActionHandler {
  private assert: AssertHelper;

  private supportedActions = new Set([
    'verify_visible',
    'verify_not_visible',
    'verify_text',
    'verify_text_contains',
    'verify_not_contains_text',
    'verify_class_contains',
    'verify_not_contains_class',
    'verify_url_contains',
    'verify_enabled',
    'verify_disabled',
    'verify_checked',
    'verify_unchecked',
    'verify_attribute',
    'verify_element_count',
    'verify_visual_snapshot',
  ]);

  constructor(assert: AssertHelper) {
    this.assert = assert;
  }

  canHandle(action: string): boolean {
    return this.supportedActions.has(action);
  }

  async handle(step: IStep, locatorStr: string, resolvedData: any, stepDesc: string): Promise<void> {
    switch (step.action) {
      case 'verify_visible':
        await this.assert.verifyVisible(locatorStr, stepDesc);
        break;
      case 'verify_not_visible':
        await this.assert.verifyNotVisible(locatorStr, stepDesc);
        break;
      case 'verify_enabled':
        await this.assert.verifyEnabled(locatorStr, stepDesc);
        break;
      case 'verify_disabled':
        await this.assert.verifyDisabled(locatorStr, stepDesc);
        break;
      case 'verify_checked':
        await this.assert.verifyChecked(locatorStr, stepDesc);
        break;
      case 'verify_unchecked':
        await this.assert.verifyUnchecked(locatorStr, stepDesc);
        break;
      case 'verify_text':
        await this.assert.verifyText(locatorStr, resolvedData, step.element, stepDesc);
        break;
      case 'verify_text_contains':
        await this.assert.verifyTextContains(locatorStr, resolvedData, step.element, stepDesc);
        break;
      case 'verify_not_contains_text':
        await this.assert.verifyNotContainsText(locatorStr, resolvedData, step.element, stepDesc);
        break;
      case 'verify_class_contains':
        await this.assert.verifyClassContains(locatorStr, resolvedData, step.element, stepDesc);
        break;
      case 'verify_not_contains_class':
        await this.assert.verifyNotContainsClass(locatorStr, resolvedData, step.element, stepDesc);
        break;
      case 'verify_url_contains':
        await this.assert.verifyUrlContains(resolvedData || step.url, stepDesc);
        break;
      case 'verify_attribute':
        if (!step.attribute) {
          throw new Error(`[JSON Error]: 'verify_attribute' requires the "attribute" field.`);
        }
        await this.assert.verifyAttribute(locatorStr, step.attribute, resolvedData, stepDesc);
        break;
      case 'verify_element_count': {
        const expectedCount = Number(resolvedData !== undefined ? resolvedData : step.count || 0);
        await this.assert.verifyElementCount(locatorStr, expectedCount, stepDesc);
        break;
      }
      case 'verify_visual_snapshot': {
        const snapshotName = step.snapshotName || `${step.page || 'page'}_${step.element || 'full'}.png`;
        const ratio = step.maxDiffPixelRatio !== undefined ? step.maxDiffPixelRatio : 0.05;
        await this.assert.verifyVisualSnapshot(locatorStr, snapshotName, ratio, stepDesc);
        break;
      }
      default:
        throw new Error(`[AssertActionHandler] Unhandled assertion: ${step.action}`);
    }
  }
}
