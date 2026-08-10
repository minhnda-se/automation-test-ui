import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ActionEngine } from '../../utils/core/ActionEngine';

const scenariosDirPath = path.join(__dirname, '../../data/scenarios');
const jsonFiles = fs.readdirSync(scenariosDirPath).filter((file) => file.endsWith('.json'));

for (const file of jsonFiles) {
  const filePath = path.join(scenariosDirPath, file);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const scenarioData = JSON.parse(fileContent);

  const isOldFormat = Array.isArray(scenarioData);
  const testCasesArray = isOldFormat ? scenarioData : scenarioData.testCases;

  const locatorFileName = isOldFormat
    ? 'locators.json'
    : scenarioData.config?.locatorFile || 'locators.json';

  const locatorFilePath = path.join(__dirname, '../../data/locators', locatorFileName);
  const dynamicLocators = JSON.parse(fs.readFileSync(locatorFilePath, 'utf-8'));

  const suiteName = isOldFormat ? file : scenarioData.scenario || file;

  test.describe(`Suite: [${suiteName}]`, () => {
    for (const testCase of testCasesArray) {
      // Data-driven test
      if (Array.isArray(testCase.dataTable) && testCase.dataTable.length > 0) {
        for (const [rowIndex, rowData] of testCase.dataTable.entries()) {
          test(`[${testCase.testId}] ${testCase.testName} - [Data Row ${rowIndex + 1}]`, async ({
            page,
            request,
          }, testInfo) => {
            const engine = new ActionEngine(page, request, testInfo, dynamicLocators, rowData);

            try {
              // Execute setup
              if (Array.isArray(testCase.preconditions)) {
                for (const [index, step] of testCase.preconditions.entries()) {
                  const stepTitle = `Setup ${index + 1}: ${step.action} - ${step.element || step.url || step.variable || ''}`;

                  await test.step(stepTitle, async () => {
                    try {
                      await engine.executeStep(step);
                    } catch (error) {
                      console.error(`Precondition failed at step ${index + 1}:`, step);
                      throw error;
                    }
                  });
                }
              }

              // Execute test steps
              if (Array.isArray(testCase.steps)) {
                for (const [stepIndex, step] of testCase.steps.entries()) {
                  const stepTitle = `Step ${stepIndex + 1}: ${step.action} - ${step.element || step.url || step.variable || ''}`;

                  await test.step(stepTitle, async () => {
                    try {
                      await engine.executeStep(step);
                    } catch (error) {
                      console.error(`Test step failed at step ${stepIndex + 1}:`, step);
                      throw error;
                    }
                  });
                }
              }
            } finally {
              // Execute teardown
              if (Array.isArray(testCase.postconditions)) {
                for (const [index, step] of testCase.postconditions.entries()) {
                  const stepTitle = `Teardown ${index + 1}: ${step.action} - ${step.element || step.url || step.variable || ''}`;

                  await test.step(stepTitle, async () => {
                    try {
                      await engine.executeStep(step);
                    } catch (error) {
                      console.error(`Postcondition failed at step ${index + 1}:`, step);
                    }
                  });
                }
              }
            }
          });
        }
      } else {
        // Standard test
        test(`[${testCase.testId || 'TC'}] ${testCase.testName}`, async ({
          page,
          request,
        }, testInfo) => {
          const engine = new ActionEngine(page, request, testInfo, dynamicLocators);

          try {
            // Execute setup
            if (Array.isArray(testCase.preconditions)) {
              for (const [index, step] of testCase.preconditions.entries()) {
                const stepTitle = `Setup ${index + 1}: ${step.action} - ${step.element || step.url || step.variable || ''}`;

                await test.step(stepTitle, async () => {
                  try {
                    await engine.executeStep(step);
                  } catch (error) {
                    console.error(`Precondition failed at step ${index + 1}:`, step);
                    throw error;
                  }
                });
              }
            }

            // Execute test steps
            if (Array.isArray(testCase.steps)) {
              for (const [stepIndex, step] of testCase.steps.entries()) {
                const stepTitle = `Step ${stepIndex + 1}: ${step.action} - ${step.element || step.url || step.variable || ''}`;

                await test.step(stepTitle, async () => {
                  try {
                    await engine.executeStep(step);
                  } catch (error) {
                    console.error(`Test step failed at step ${stepIndex + 1}:`, step);
                    throw error;
                  }
                });
              }
            }
          } finally {
            // Execute teardown
            if (Array.isArray(testCase.postconditions)) {
              for (const [index, step] of testCase.postconditions.entries()) {
                const stepTitle = `Teardown ${index + 1}: ${step.action} - ${step.element || step.url || step.variable || ''}`;

                await test.step(stepTitle, async () => {
                  try {
                    await engine.executeStep(step);
                  } catch (error) {
                    console.error(`Postcondition failed at step ${index + 1}:`, step);
                  }
                });
              }
            }
          }
        });
      }
    }
  });
}
