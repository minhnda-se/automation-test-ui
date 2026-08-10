# Playwright Hybrid Keyword-Driven Framework

A powerful Automation Testing Framework built with **Playwright** and **TypeScript**. The framework follows **Clean Architecture** and **Keyword-Driven Testing**, allowing QA Engineers and Business Analysts to create automated test scenarios entirely in JSON without writing any code.

---

# Core Features

- **Zero-Code Scripting**: Create test cases entirely using JSON files.
- **Data-Driven Testing (DDT)**: Execute a single test scenario with multiple datasets.
- **Dynamic Data Interpolation**: Generate random Email, Phone Number, Timestamp, and other values at runtime.
- **Runtime Variables (State Sharing)**: Store data from one step and reuse it in later steps.
- **Hybrid API & UI Testing**: Perform API setup and teardown before UI execution for faster and more reliable end-to-end testing.
- **Automatic Evidence Collection**: Automatically capture screenshots for every assertion (PASS/FAIL) and attach them to the HTML report.
- **Multi-Tab Support**: Handle browser tabs and popup windows seamlessly.
- **Clean Architecture**: Designed according to the Single Responsibility Principle (SRP).

---

# Directory Structure

```text
project-root/
├── data/
│   ├── locators/
│   │   ├── locators.json
│   │   └── advanced-locators.json
│   └── scenarios/
│       ├── auth-scenarios.json
│       └── e2e-scenarios.json
├── tests/
│   └── hybrid-json/
│       └── keyword-runner.spec.ts
└── utils/
    ├── core/
    │   ├── ActionEngine.ts
    │   ├── DataManager.ts
    │   └── LocatorManager.ts
    └── helpers/
        ├── APIHelper.ts
        ├── AssertHelper.ts
        ├── BaseHelper.ts
        └── ElementHelper.ts
```

---

# Scenario File Structure

Each scenario file inside `data/scenarios/` follows the structure below:

```json
{
  "config": {
    "locatorFile": "locators.json"
  },
  "scenario": "Scenario Name",
  "testCases": [
    {
      "testId": "TC_01",
      "testName": "Test Case Description",
      "dataTable": [],
      "steps": [
        {
          "action": "goto",
          "data": "https://example.com"
        }
      ]
    }
  ]
}
```

The Ultimate JSON Template:

```json
{
  "config": {
    "locatorFile": "enterprise-locators.json"
  },
  "scenario": "Hybrid E2E Framework Demonstration",
  "testCases": [
    {
      "testId": "ULTIMATE_01",
      "testName": "[E2E] Tạo User qua API -> Đăng nhập UI -> Cập nhật Hồ sơ -> Xóa User qua API",
      "description": "Kịch bản chứng minh khả năng mix API/UI, DDT, và State Sharing của Framework",
      "dataTable": [
        { "role_name": "Admin", "expected_greeting": "Welcome, Administrator" },
        { "role_name": "Editor", "expected_greeting": "Welcome, Editor" }
      ],
      "preconditions": [
        {
          "action": "api_post",
          "url": "https://api.example.com/v1/users",
          "data": {
            "email": "test_{{TIMESTAMP}}@automation.com",
            "password": "Pass_{{RANDOM_STRING}}",
            "role": "{{role_name}}"
          },
          "store_response": {
            "key": "userId",
            "variable": "CREATED_USER_ID"
          }
        },
        {
          "action": "store_text",
          "variable": "TEMP_EMAIL",
          "data": "test_{{TIMESTAMP}}@automation.com"
        }
      ],
      "steps": [
        { "action": "goto", "data": "https://www.example.com/login" },

        {
          "action": "fill",
          "page": "LoginPage",
          "element": "emailInput",
          "data": "{{TEMP_EMAIL}}"
        },
        {
          "action": "fill",
          "page": "LoginPage",
          "element": "passwordInput",
          "data": "Pass_{{RANDOM_STRING}}"
        },
        { "action": "click", "page": "LoginPage", "element": "loginBtn" },

        { "action": "verify_visible", "page": "Dashboard", "element": "avatarIcon" },

        {
          "action": "verify_text_contains",
          "page": "Dashboard",
          "element": "welcomeText",
          "data": "{{expected_greeting}}"
        },

        { "action": "goto", "data": "https://www.example.com/profile/{{CREATED_USER_ID}}" },
        {
          "action": "store_text",
          "page": "ProfilePage",
          "element": "systemId",
          "variable": "UI_USER_ID"
        },

        {
          "action": "verify_text",
          "page": "ProfilePage",
          "element": "systemId",
          "data": "{{CREATED_USER_ID}}"
        }
      ],
      "postconditions": [
        {
          "action": "api_delete",
          "url": "https://api.example.com/v1/users/{{CREATED_USER_ID}}"
        },
        {
          "action": "api_get",
          "url": "https://api.example.com/v1/users/{{CREATED_USER_ID}}",
          "expected_status": 404
        }
      ]
    }
  ]
}
```

---

# Supported Actions

For the complete list of supported keywords, see `utils/core/ActionEngine.ts`.

## 1. UI Interactions

| Action           | Required Fields               | Description                                |
| ---------------- | ----------------------------- | ------------------------------------------ |
| `goto`           | `data`                        | Navigate to a URL                          |
| `click`          | `page`, `element`             | Perform a left mouse click                 |
| `right_click`    | `page`, `element`             | Perform a right mouse click                |
| `double_click`   | `page`, `element`             | Perform a double click                     |
| `fill`           | `page`, `element`, `data`     | Enter text into an input field             |
| `switch_new_tab` | None                          | Switch to the newly opened browser tab     |
| `store_text`     | `page`, `element`, `variable` | Store element text into a runtime variable |

---

## 2. Assertions

All assertion actions automatically capture screenshots and attach them to the HTML report.

| Action                     | Required Fields           | Description                                            |
| -------------------------- | ------------------------- | ------------------------------------------------------ |
| `verify_visible`           | `page`, `element`         | Verify the element is visible                          |
| `verify_text`              | `page`, `element`, `data` | Verify the exact text                                  |
| `verify_text_contains`     | `page`, `element`, `data` | Verify the element contains the expected text          |
| `verify_not_contains_text` | `page`, `element`, `data` | Verify the element does not contain the specified text |
| `verify_class_contains`    | `page`, `element`, `data` | Verify the class attribute contains the expected value |
| `verify_url_contains`      | `data`                    | Verify the current URL contains the expected string    |

---

## 3. API Integration

| Action       | Required Fields | Description           |
| ------------ | --------------- | --------------------- |
| `api_post`   | `url`, `data`   | Send a POST request   |
| `api_get`    | `url`           | Send a GET request    |
| `api_delete` | `url`           | Send a DELETE request |

---

# Advanced Features

## 1. Dynamic Data

The framework supports the following built-in placeholders:

| Placeholder         | Example                        |
| ------------------- | ------------------------------ |
| `{{TIMESTAMP}}`     | `1723000000000`                |
| `{{RANDOM_EMAIL}}`  | `qa_1723000000@automation.com` |
| `{{RANDOM_STRING}}` | `A8F9B2`                       |
| `{{RANDOM_PHONE}}`  | `0912345678`                   |

Example:

```json
{
  "action": "fill",
  "data": "Password_{{RANDOM_STRING}}"
}
```

Runtime output:

```text
Password_A8F9B2
```

---

## 2. Runtime Variables (State Sharing)

Store a value:

```json
{
  "action": "store_text",
  "page": "OrderPage",
  "element": "orderId",
  "variable": "MY_ORDER"
}
```

Reuse the stored value:

```json
{
  "action": "fill",
  "page": "SearchPage",
  "element": "searchInput",
  "data": "{{MY_ORDER}}"
}
```

---

## 3. Data-Driven Testing (DDT)

Execute the same test case with multiple datasets.

```json
{
  "testId": "DDT_01",
  "testName": "Login with Multiple Accounts",
  "dataTable": [
    {
      "user": "admin",
      "pass": "123456"
    },
    {
      "user": "locked_user",
      "pass": "secret"
    }
  ],
  "steps": [
    {
      "action": "fill",
      "page": "Login",
      "element": "username",
      "data": "{{user}}"
    },
    {
      "action": "fill",
      "page": "Login",
      "element": "password",
      "data": "{{pass}}"
    }
  ]
}
```

---

## 4. API Setup and Teardown

```json
{
  "action": "api_post",
  "url": "https://api.example.com/users",
  "data": {
    "name": "QA_User",
    "job": "Tester"
  },
  "store_response": {
    "key": "id",
    "variable": "NEW_USER_ID"
  }
}
```

---

# Execution

## 1. Install Dependencies

```bash
npm install
npx playwright install
```

---

## 2. Execute All JSON Scenarios

```bash
npx playwright test tests/hybrid-json/
```

---

## 3. Run in UI Mode

```bash
npx playwright test tests/hybrid-json/ --ui
```

---

## 4. View the HTML Report

```bash
npx playwright show-report
```

---

# Framework Architecture

```text
JSON Scenario
       │
       ▼
Keyword Runner
       │
       ▼
 Action Engine
       │
 ┌─────┼─────────┐
 ▼     ▼         ▼
UI    API   Assertions
 │     │         │
 ▼     ▼         ▼
Playwright Helpers
```

Each helper class is responsible for a single functional area, making the framework:

- Easy to maintain
- Easy to extend
- Fully compliant with the Single Responsibility Principle (SRP)
- Easy to add new keywords without modifying the existing implementation

---

# Technology Stack

- Playwright
- TypeScript
- Node.js
- Playwright Test Runner
- JSON
- HTML Report
- Clean Architecture
- Keyword-Driven Testing
- Data-Driven Testing

---

> This framework follows **Clean Architecture** and **Keyword-Driven Testing** principles. New keywords can be added simply by implementing a helper method and registering it in `ActionEngine`, without affecting the existing framework components.
"# automation-test-ui" 
"# automation-test-ui" 
