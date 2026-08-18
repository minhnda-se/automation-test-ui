import * as fs from 'fs';
import * as path from 'path';

// Lấy tên file từ command line
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('[Error] Vui lòng truyền tên file CSV.');
  console.error('Usage: npm run csv2json -- data.csv');
  process.exit(1);
}

const csvFileName = args[0].endsWith('.csv') ? args[0] : `${args[0]}.csv`;
const csvFilePath = path.join(__dirname, '../docs', csvFileName);
const jsonFileName = csvFileName.replace('.csv', '.json');
const jsonFilePath = path.join(__dirname, '../data/scenarios', jsonFileName);

// Trình phân tích CSV chịu lỗi (xử lý dấu phẩy trong ngoặc kép)
function parseCSVRow(str: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '"') {
      inQuote = !inQuote;
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
    console.error(`[Error] Không tìm thấy file CSV tại: ${csvFilePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length < 2) {
    console.error('[Error] File CSV trống hoặc thiếu dữ liệu.');
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

    // Khởi tạo TestCase nếu chưa tồn tại trong Map
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

    // Tạo đối tượng hành động
    const actionObj: any = {
      action: rowData['action'],
    };

    if (rowData['page']) actionObj.page = rowData['page'];
    if (rowData['element']) actionObj.element = rowData['element'];
    if (rowData['data']) actionObj.data = rowData['data'];

    // Phân phối vào đúng mảng dựa trên cột Phase
    const phase = rowData['phase']?.toLowerCase();
    if (phase === 'setup' || phase === 'precondition') {
      tc.preconditions.push(actionObj);
    } else if (phase === 'teardown' || phase === 'postcondition') {
      tc.postconditions.push(actionObj);
    } else if (phase === 'step') {
      tc.steps.push(actionObj);
    }
  }

  // Chuyển Map thành Array
  ultimateJson.testCases = Array.from(testCaseMap.values());

  // Ghi ra file JSON
  fs.writeFileSync(jsonFilePath, JSON.stringify(ultimateJson, null, 2), 'utf-8');
  console.log(`[Success] Đã biên dịch thành công file CSV sang JSON.`);
  console.log(`[Output] ${jsonFilePath}`);
}

compileCSVtoJSON();
