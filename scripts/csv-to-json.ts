import * as fs from 'fs';
import * as path from 'path';

// Read the file name from the command line
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('[Error] Pass the CSV file name as an argument.');
  console.error('Usage: npm run csv2json -- data.csv');
  process.exit(1);
}

const rawArg = args[0];
const normalizedArg = rawArg.endsWith('.csv') ? rawArg : `${rawArg}.csv`;
const explicitPath = path.isAbsolute(normalizedArg)
  ? normalizedArg
  : path.resolve(process.cwd(), normalizedArg);
const csvFilePath = fs.existsSync(explicitPath)
  ? explicitPath
  : path.join(__dirname, '../data/csv', normalizedArg);
const csvFileName = path.basename(csvFilePath);
const jsonFileName = csvFileName.replace(/\.csv$/i, '.json');
const jsonFilePath = path.join(__dirname, '../data/scenarios', jsonFileName);

// RFC 4180 CSV parser: handles commas inside quoted fields and the doubled "" escape
function parseCSVRow(str: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '"') {
      if (inQuote && str[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (str[i] === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += str[i];
    }
  }
  result.push(cur.trim());
  return result;
}

function compileCSVtoJSON() {
  if (!fs.existsSync(csvFilePath)) {
    console.error(`[Error] CSV file not found at: ${csvFilePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length < 2) {
    console.error('[Error] CSV file is empty or has no data rows.');
    process.exit(1);
  }

  const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase());

  const ultimateJson: any = {
    config: {
      locatorFile: `${path.parse(csvFileName).name}.json`,
    },
    scenario: `Compiled from ${csvFileName}`,
    testCases: [],
  };

  const testCaseMap = new Map<string, any>();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    const rowData: any = {};

    headers.forEach((header, index) => {
      rowData[header] = row[index] || '';
    });

    const testId = rowData['testid'];
    if (!testId) continue;

    // Create the test case on first sight of its id
    if (!testCaseMap.has(testId)) {
      testCaseMap.set(testId, {
        testId: testId,
        testName: rowData['testname'] || `Test Case ${testId}`,
        description: rowData['description'] || '',
        preconditions: [],
        steps: [],
        postconditions: [],
      });
    }

    const tc = testCaseMap.get(testId);

    // Build the step object
    const actionObj: any = {
      action: rowData['action'],
    };

    if (rowData['page']) actionObj.page = rowData['page'];
    if (rowData['element']) actionObj.element = rowData['element'];
    if (rowData['data']) actionObj.data = rowData['data'];
    if (rowData['url']) actionObj.url = rowData['url'];
    if (rowData['variable']) actionObj.variable = rowData['variable'];
    if (rowData['storeas'] || rowData['variable']) actionObj.storeAs = rowData['storeas'] || rowData['variable'];
    if (rowData['timeout']) actionObj.timeout = Number(rowData['timeout']);
    if (rowData['status']) actionObj.status = Number(rowData['status']);
    if (rowData['mockdata']) {
      try {
        actionObj.mockData = JSON.parse(rowData['mockdata']);
      } catch {
        actionObj.mockData = rowData['mockdata'];
      }
    }

    // Route the step by its Phase column
    const phase = rowData['phase']?.toLowerCase();
    if (phase === 'setup' || phase === 'precondition') {
      tc.preconditions.push(actionObj);
    } else if (phase === 'teardown' || phase === 'postcondition') {
      tc.postconditions.push(actionObj);
    } else if (phase === 'step') {
      tc.steps.push(actionObj);
    }
  }

  // Map to array
  ultimateJson.testCases = Array.from(testCaseMap.values());

  // Write the JSON output
  fs.writeFileSync(jsonFilePath, JSON.stringify(ultimateJson, null, 2), 'utf-8');
  console.log(`[Success] Compiled the CSV into a JSON scenario.`);
  console.log(`[Output] ${jsonFilePath}`);
}

compileCSVtoJSON();
