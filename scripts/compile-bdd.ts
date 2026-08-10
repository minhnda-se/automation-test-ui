import * as fs from 'fs';
import * as path from 'path';

// 1. TỪ ĐIỂN DỊCH (Mapping Dictionary)
const stepMappings = [
  {
    regex: /I go to "(.*)"/,
    build: (m: string[]) => ({ action: 'goto', data: m[1] }),
  },
  {
    regex: /I click "(.*)" on "(.*)"/,
    build: (m: string[]) => ({ action: 'click', element: m[1], page: m[2] }),
  },
  {
    regex: /I fill "(.*)" into "(.*)" on "(.*)"/,
    build: (m: string[]) => ({ action: 'fill', data: m[1], element: m[2], page: m[3] }),
  },
  {
    regex: /I verify "(.*)" is visible on "(.*)"/,
    build: (m: string[]) => ({ action: 'verify_visible', element: m[1], page: m[2] }),
  },
  {
    regex: /I verify "(.*)" on "(.*)" has text "(.*)"/,
    build: (m: string[]) => ({ action: 'verify_text', element: m[1], page: m[2], data: m[3] }),
  },
  {
    regex: /I save text from "(.*)" on "(.*)" as "(.*)"/,
    build: (m: string[]) => ({ action: 'store_text', element: m[1], page: m[2], variable: m[3] }),
  },
];

// Hàm dịch 1 câu Gherkin thành 1 khối JSON Action
function parseStep(line: string) {
  // Cắt bỏ các từ khóa Given, When, Then, And, But ở đầu câu
  const cleanLine = line.replace(/^(Given|When|Then|And|But)\s+/, '').trim();

  for (const mapping of stepMappings) {
    const match = cleanLine.match(mapping.regex);
    if (match) {
      return mapping.build(match);
    }
  }
  throw new Error(`❌ Không thể dịch câu Gherkin này: "${line}"`);
}

// 2. LOGIC ĐỌC FILE VÀ BIÊN DỊCH
const featuresDir = path.join(__dirname, '../data/features');
const scenariosDir = path.join(__dirname, '../data/scenarios');

// Tạo thư mục nếu chưa có
if (!fs.existsSync(featuresDir)) fs.mkdirSync(featuresDir, { recursive: true });
if (!fs.existsSync(scenariosDir)) fs.mkdirSync(scenariosDir, { recursive: true });

const featureFiles = fs.readdirSync(featuresDir).filter((file) => file.endsWith('.feature'));

for (const file of featureFiles) {
  const fileContent = fs.readFileSync(path.join(featuresDir, file), 'utf-8');
  const lines = fileContent
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let outputJson: any = {
    $schema: '../../schema/scenario-schema.json',
    config: { locatorFile: 'locators.json' },
    scenario: '',
    testCases: [],
  };

  let currentTestCase: any = null;

  for (const line of lines) {
    if (line.startsWith('Feature:')) {
      outputJson.scenario = line.replace('Feature:', '').trim();
    } else if (line.startsWith('Scenario:')) {
      if (currentTestCase) outputJson.testCases.push(currentTestCase);

      currentTestCase = {
        testId: `BDD_${Date.now().toString().slice(-4)}`, // Sinh ID ngẫu nhiên 4 số
        testName: line.replace('Scenario:', '').trim(),
        steps: [],
      };
    } else if (/^(Given|When|Then|And|But)/.test(line)) {
      if (currentTestCase) {
        currentTestCase.steps.push(parseStep(line));
      }
    }
  }

  // Push test case cuối cùng vào mảng
  if (currentTestCase) outputJson.testCases.push(currentTestCase);

  // Ghi file JSON ra thư mục Scenarios
  const outputFileName = file.replace('.feature', '-generated.json');
  fs.writeFileSync(path.join(scenariosDir, outputFileName), JSON.stringify(outputJson, null, 2));

  console.log(`✅ Đã biên dịch: ${file} -> ${outputFileName}`);
}
