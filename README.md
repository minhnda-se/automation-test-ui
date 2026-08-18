# Playwright Hybrid Keyword-Driven Framework

A powerful automation testing framework built with **Playwright** and **TypeScript**. The framework follows **Clean Architecture** and **Keyword-Driven Testing**, allowing QA Engineers and Business Analysts to create automated test scenarios entirely in JSON without writing code.

The framework supports **Hybrid UI/API Testing**, **BDD Gherkin**, **Data-Driven Testing (DDT)**, **AI Auto-Healing**, **Runtime Variables**, and **Automatic Evidence Collection**, making it suitable for both small projects and enterprise-scale automation.

---

# Table of Contents

- [Core Features](#core-features)
- [Directory Structure](#directory-structure)
- [Scenario File Structure](#scenario-file-structure)
- [Ultimate JSON Template](#ultimate-json-template)
- [Supported Actions](#supported-actions)
- [Advanced Features](#advanced-features)
- [Execution](#execution)
- [Framework Architecture](#framework-architecture)
- [Technology Stack](#technology-stack)

---

# Core Features

- **Zero-Code Scripting**
  - Create automation test cases entirely in JSON without writing TypeScript code.

- **BDD Gherkin Support**
  - Write test scenarios using natural language (`.feature` files) and automatically compile them into executable JSON scripts.

- **AI Auto-Healing**
  - Automatically detect invalid or broken locators during execution.
  - Request AI assistance to generate more reliable CSS selectors.
  - Retry the failed action without interrupting the test execution.

- **Data-Driven Testing (DDT)**
  - Execute the same scenario with multiple datasets using a single test definition.

- **Dynamic Data Interpolation**
  - Generate random emails, phone numbers, timestamps, strings, and other runtime values.

- **Runtime Variables (State Sharing)**
  - Store values captured from the UI or API and reuse them in subsequent steps.

- **Hybrid API & UI Testing**
  - Perform API setup and teardown before or after UI execution to reduce execution time and improve test stability.

- **Automatic Evidence Collection**
  - Capture screenshots automatically for every assertion (PASS or FAIL) and attach them to the Playwright HTML Report.

- **Multi-Tab Support**
  - Seamlessly switch between browser tabs and popup windows.

- **Clean Architecture**
  - Built following the Single Responsibility Principle (SRP), making the framework highly maintainable and extensible.

---

# Directory Structure

> **Note:** The directory structure below is a reference implementation and will continue to evolve as the framework grows.

```text
project-root/
├── data/
│   ├── locators/
│   │   ├── locators.json
│   │   └── advanced-locators.json
│   └── scenarios/
│       ├── auth-scenarios.json
│       └── e2e-scenarios.json
│
├── tests/
│   └── hybrid-json/
│       └── keyword-runner.spec.ts
│
└── utils/
    ├── core/
    │   ├── ActionEngine.ts
    │   ├── AutoHealer.ts
    │   ├── DataManager.ts
    │   └── LocatorManager.ts
    │
    └── helpers/
        ├── APIHelper.ts
        ├── AssertHelper.ts
        ├── BaseHelper.ts
        └── ElementHelper.ts
```

## Folder Description

| Folder              | Description                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `data/locators`     | Stores all locator definition files.                                                             |
| `data/scenarios`    | Stores JSON automation scenarios.                                                                |
| `tests/hybrid-json` | Main Playwright runner that executes JSON scenarios.                                             |
| `utils/core`        | Core framework engine responsible for orchestration and runtime processing.                      |
| `utils/helpers`     | Helper classes responsible for UI interaction, API requests, assertions, and screenshot capture. |

---

# Scenario File Structure

Each JSON file located in `data/scenarios/` represents a test suite.

The framework supports two scenario formats:

- Standard JSON Scenario (recommended)
- Legacy JSON Array (backward compatibility)

A standard scenario file has the following structure:

```json
{
  "config": {
    "locatorFile": "locators.json"
  },
  "scenario": "Login Test Suite",
  "testCases": [
    {
      "testId": "TC_01",
      "testName": "Valid Login",
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

## Root Properties

| Property    | Required | Description                                         |
| ----------- | -------- | --------------------------------------------------- |
| `config`    | Yes      | Framework configuration.                            |
| `scenario`  | Yes      | Test suite name displayed in the Playwright report. |
| `testCases` | Yes      | Collection of test cases.                           |

---

## Test Case Properties

| Property         | Required | Description                               |
| ---------------- | -------- | ----------------------------------------- |
| `testId`         | Yes      | Unique identifier of the test case.       |
| `testName`       | Yes      | Test case name displayed in the report.   |
| `description`    | No       | Optional test description.                |
| `dataTable`      | No       | Dataset used for Data-Driven Testing.     |
| `preconditions`  | No       | Steps executed before the main test flow. |
| `steps`          | Yes      | Main test steps.                          |
| `postconditions` | No       | Cleanup steps executed after the test.    |

---

## Execution Flow

Each test case follows the execution sequence below:

```text
Preconditions
      │
      ▼
Main Test Steps
      │
      ▼
Postconditions
```

- **Preconditions**
  - Used to prepare test data.
  - Commonly executed through API requests.

- **Main Test Steps**
  - Perform UI interactions and assertions.

- **Postconditions**
  - Remove test data.
  - Reset application state.
  - Always executed, even if the test fails.

---

# Ultimate JSON Template

The example below demonstrates all major framework capabilities in a single test scenario.

Features included:

- API setup
- API teardown
- Runtime variables
- Dynamic data
- Data-driven testing
- Assertions
- Hybrid API/UI workflow

```json
{
  "config": {
    "locatorFile": "enterprise-locators.json"
  },
  "scenario": "Hybrid E2E Framework Demonstration",
  "testCases": [
    {
      "testId": "ULTIMATE_01",
      "testName": "[E2E] API Setup → UI Login → UI Verification → API Teardown",
      "description": "Demonstrates hybrid API/UI execution with runtime variables and DDT.",

      "dataTable": [
        {
          "role_name": "Admin",
          "expected_greeting": "Welcome, Administrator"
        },
        {
          "role_name": "Editor",
          "expected_greeting": "Welcome, Editor"
        }
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
        {
          "action": "goto",
          "data": "https://www.example.com/login"
        },

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

        {
          "action": "click",
          "page": "LoginPage",
          "element": "loginButton"
        },

        {
          "action": "verify_visible",
          "page": "DashboardPage",
          "element": "avatar"
        },

        {
          "action": "verify_text_contains",
          "page": "DashboardPage",
          "element": "welcomeText",
          "data": "{{expected_greeting}}"
        },

        {
          "action": "goto",
          "data": "https://www.example.com/profile/{{CREATED_USER_ID}}"
        },

        {
          "action": "store_text",
          "page": "ProfilePage",
          "element": "userId",
          "variable": "UI_USER_ID"
        },

        {
          "action": "verify_text",
          "page": "ProfilePage",
          "element": "userId",
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

## Runtime Execution

When the scenario is executed, the framework performs the following sequence:

```text
API Create User
        │
        ▼
Store User ID
        │
        ▼
Open Login Page
        │
        ▼
Login Using Generated Account
        │
        ▼
Verify Dashboard
        │
        ▼
Open User Profile
        │
        ▼
Validate User ID
        │
        ▼
Delete User via API
        │
        ▼
Verify User Deletion
```

---

# Supported Actions

The framework provides a rich set of built-in keywords for UI automation, assertions, and API integration.

Each action is implemented in the `ActionEngine` and executed through specialized helper classes.

---

# UI Interactions

These actions perform browser interactions using Playwright.

| Action             | Required Fields                            | Description                                       |
| ------------------ | ------------------------------------------ | ------------------------------------------------- |
| `goto`             | `data`                                     | Navigate to the specified URL.                    |
| `click`            | `page`, `element`                          | Perform a left mouse click.                       |
| `right_click`      | `page`, `element`                          | Perform a right mouse click.                      |
| `double_click`     | `page`, `element`                          | Perform a double click.                           |
| `hover`            | `page`, `element`                          | Hover over an element.                            |
| `fill`             | `page`, `element`, `data`                  | Enter text into an input field.                   |
| `clear`            | `page`, `element`                          | Clear an input field.                             |
| `press`            | `page`, `element`, `data`                  | Press a keyboard key.                             |
| `select_option`    | `page`, `element`, `data`                  | Select an option from a dropdown list.            |
| `check`            | `page`, `element`                          | Check a checkbox.                                 |
| `uncheck`          | `page`, `element`                          | Uncheck a checkbox.                               |
| `switch_new_tab`   | None                                       | Switch to the newly opened browser tab.           |
| `close_tab`        | None                                       | Close the current browser tab.                    |
| `reload`           | None                                       | Reload the current page.                          |
| `go_back`          | None                                       | Navigate back in browser history.                 |
| `go_forward`       | None                                       | Navigate forward in browser history.              |
| `wait`             | `data`                                     | Wait for the specified number of milliseconds.    |
| `wait_for_element` | `page`, `element`                          | Wait until the element becomes visible.           |
| `scroll_into_view` | `page`, `element`                          | Scroll the page until the element is visible.     |
| `store_text`       | `page`, `element`, `variable`              | Store an element's text into a runtime variable.  |
| `store_attribute`  | `page`, `element`, `attribute`, `variable` | Store an attribute value into a runtime variable. |

---

## Example

```json
{
  "action": "fill",
  "page": "LoginPage",
  "element": "username",
  "data": "standard_user"
}
```

---

# Assertions

Assertion actions automatically capture screenshots and attach them to the Playwright HTML Report.

| Action                     | Required Fields                        | Description                                                      |
| -------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `verify_visible`           | `page`, `element`                      | Verify that an element is visible.                               |
| `verify_hidden`            | `page`, `element`                      | Verify that an element is hidden.                                |
| `verify_enabled`           | `page`, `element`                      | Verify that an element is enabled.                               |
| `verify_disabled`          | `page`, `element`                      | Verify that an element is disabled.                              |
| `verify_checked`           | `page`, `element`                      | Verify that a checkbox is checked.                               |
| `verify_unchecked`         | `page`, `element`                      | Verify that a checkbox is unchecked.                             |
| `verify_text`              | `page`, `element`, `data`              | Verify that the element text exactly matches the expected value. |
| `verify_text_contains`     | `page`, `element`, `data`              | Verify that the element contains the expected text.              |
| `verify_not_contains_text` | `page`, `element`, `data`              | Verify that the element does not contain the specified text.     |
| `verify_attribute`         | `page`, `element`, `attribute`, `data` | Verify an attribute value.                                       |
| `verify_class_contains`    | `page`, `element`, `data`              | Verify that the class attribute contains the expected value.     |
| `verify_url`               | `data`                                 | Verify the current URL.                                          |
| `verify_url_contains`      | `data`                                 | Verify that the current URL contains the expected string.        |
| `verify_title`             | `data`                                 | Verify the page title.                                           |
| `verify_count`             | `page`, `element`, `data`              | Verify the number of matched elements.                           |

---

## Example

```json
{
  "action": "verify_text_contains",
  "page": "DashboardPage",
  "element": "welcomeMessage",
  "data": "Welcome"
}
```

---

# API Integration

The framework supports API operations for test data preparation and cleanup.

These actions are executed using Playwright's built-in APIRequestContext.

| Action       | Required Fields | Description            |
| ------------ | --------------- | ---------------------- |
| `api_get`    | `url`           | Send a GET request.    |
| `api_post`   | `url`, `data`   | Send a POST request.   |
| `api_put`    | `url`, `data`   | Send a PUT request.    |
| `api_patch`  | `url`, `data`   | Send a PATCH request.  |
| `api_delete` | `url`           | Send a DELETE request. |

Optional fields:

| Property          | Description                           |
| ----------------- | ------------------------------------- |
| `headers`         | Custom request headers.               |
| `expected_status` | Expected HTTP status code.            |
| `store_response`  | Store a value from the JSON response. |

---

## Example

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
    "variable": "USER_ID"
  }
}
```

---

# Advanced Features

The framework provides several advanced capabilities that simplify enterprise-level automation.

---

# Dynamic Data

Dynamic placeholders are resolved automatically before executing each step.

Supported placeholders include:

| Placeholder         | Description                | Example                        |
| ------------------- | -------------------------- | ------------------------------ |
| `{{TIMESTAMP}}`     | Current Unix timestamp     | `1723000000000`                |
| `{{RANDOM_EMAIL}}`  | Random email address       | `qa_1723000000@automation.com` |
| `{{RANDOM_STRING}}` | Random alphanumeric string | `A8F9B2`                       |
| `{{RANDOM_PHONE}}`  | Random phone number        | `0912345678`                   |

Example:

```json
{
  "action": "fill",
  "page": "RegisterPage",
  "element": "email",
  "data": "{{RANDOM_EMAIL}}",
  "storeAs": "STORED_EMAIL" //optional
}
```

Runtime:

```text
qa_1723000000@automation.com
```

Dynamic placeholders can also be combined with regular text.

Example:

```json
{
  "data": "Password_{{RANDOM_STRING}}"
}
```

Runtime:

```text
Password_K8D2P1
```

---

# Runtime Variables (State Sharing)

Runtime variables allow data captured during execution to be reused in subsequent steps.

This feature is useful for:

- Order IDs
- User IDs
- Generated emails
- API response values
- Dynamic page content

Store a value:

```json
{
  "action": "store_text",
  "page": "OrderPage",
  "element": "orderId",
  "variable": "ORDER_ID"
}
```

Reuse the stored value:

```json
{
  "action": "fill",
  "page": "SearchPage",
  "element": "searchBox",
  "data": "{{ORDER_ID}}"
}
```

Variables can also be populated directly from API responses.

```json
{
  "store_response": {
    "key": "id",
    "variable": "USER_ID"
  }
}
```

## The framework automatically resolves all runtime variables before executing each action.

# Data-Driven Testing (DDT)

Data-Driven Testing allows the same test scenario to be executed multiple times using different datasets.

Instead of duplicating test cases, simply define a `dataTable`. The framework automatically generates a Playwright test for each row.

## Example

```json
{
  "testId": "DDT_01",
  "testName": "Login with Multiple Accounts",

  "dataTable": [
    {
      "username": "standard_user",
      "password": "secret_sauce"
    },
    {
      "username": "problem_user",
      "password": "secret_sauce"
    },
    {
      "username": "performance_glitch_user",
      "password": "secret_sauce"
    }
  ],

  "steps": [
    {
      "action": "fill",
      "page": "LoginPage",
      "element": "username",
      "data": "{{username}}"
    },
    {
      "action": "fill",
      "page": "LoginPage",
      "element": "password",
      "data": "{{password}}"
    }
  ]
}
```

The generated Playwright tests will appear as:

```text
[DDT_01] Login with Multiple Accounts - Data Row 1

[DDT_01] Login with Multiple Accounts - Data Row 2

[DDT_01] Login with Multiple Accounts - Data Row 3
```

---

# BDD Gherkin Support

The framework supports writing test scenarios using the Gherkin language. Feature files are written in a human-readable format and are automatically converted into executable JSON scenarios.

Example:

```gherkin
Feature: Login

  Scenario: Successful Login

    Given I go to "https://www.saucedemo.com/"

    When I fill "standard_user" into "usernameInput" on "LoginPage"

    And I fill "secret_sauce" into "passwordInput" on "LoginPage"

    And I click "loginBtn" on "LoginPage"

    Then I verify "cartIcon" is visible on "InventoryPage"
```

## Step Format

| Step                                                 | Description                       |
| ---------------------------------------------------- | --------------------------------- |
| `Given I go to "<url>"`                              | Navigate to the specified URL     |
| `When I fill "<value>" into "<locator>" on "<page>"` | Enter a value into an input field |
| `And I click "<locator>" on "<page>"`                | Click an element                  |
| `Then I verify "<locator>" is visible on "<page>"`   | Verify that an element is visible |

The compiler automatically converts the feature file into an executable JSON scenario.

Execution flow:

```text
.feature
      │
      ▼
BDD Compiler
      │
      ▼
JSON Scenario
      │
      ▼
Action Engine
      │
      ▼
Playwright
```

---

# AI Auto-Healing

One of the framework's key capabilities is AI-powered locator healing.

When an element cannot be found:

1. The framework detects the failure.
2. The original locator is collected.
3. DOM information is extracted.
4. AI generates a more reliable CSS selector.
5. The failed action is retried automatically.

Execution flow:

```text
Locate Element
       │
       ▼
Locator Failed
       │
       ▼
Collect DOM Information
       │
       ▼
Request AI
       │
       ▼
Generate New Locator
       │
       ▼
Retry Action
```

Benefits:

- Reduced maintenance effort
- Improved test stability
- Faster recovery from UI changes
- Minimal manual locator updates

---

# Execution

## Install Dependencies

```bash
npm install
```

Install Playwright browsers.

```bash
npx playwright install
```

---

## Execute All JSON Scenarios

```bash
npx playwright test tests/hybrid-json/
```

---

## Execute a Specific Test File

```bash
npx playwright test tests/hybrid-json/login.spec.ts
```

---

## Run in UI Mode

```bash
npx playwright test --ui
```

---

## Run in Headed Mode

```bash
npx playwright test --headed
```

---

## Run with Multiple Workers

```bash
npx playwright test --workers=4
```

---

## View HTML Report

```bash
npx playwright show-report
```

---

# HTML Report

The framework automatically generates the Playwright HTML Report.

The report includes:

- Test execution summary
- Pass / Fail statistics
- Test duration
- Execution timeline
- Automatic screenshots
- Error stack traces
- Nested execution steps
- Runtime logs

Report location:

```text
playwright-report/
```

---

# GitHub Actions (CI/CD)

The framework can be integrated with GitHub Actions.

Example workflow:

```yaml
- Install dependencies

- Install Playwright browsers

- Execute tests

- Upload Playwright Report

- Publish GitHub Pages
```

Benefits:

- Automatic execution on every push
- Automatic execution for Pull Requests
- HTML report publishing
- Artifact storage
- Cross-platform execution

---

# Framework Architecture

The framework follows a layered architecture.

```text
Feature File / JSON Scenario
               │
               ▼
      Keyword Runner
               │
               ▼
       Action Engine
               │
     ┌─────────┼─────────┐
     ▼         ▼         ▼
 Element    Assertion    API
 Helper      Helper     Helper
     │         │         │
     └─────────┼─────────┘
               ▼
          Playwright
```

Responsibilities:

| Layer           | Responsibility                                     |
| --------------- | -------------------------------------------------- |
| Keyword Runner  | Loads JSON scenarios and executes test cases       |
| Action Engine   | Maps keywords to framework actions                 |
| Locator Manager | Resolves element locators                          |
| Data Manager    | Handles runtime variables and dynamic placeholders |
| Auto Healer     | Repairs broken locators using AI                   |
| Helper Classes  | Execute Playwright operations                      |

---

# Technology Stack

| Technology         | Purpose                |
| ------------------ | ---------------------- |
| Playwright         | Browser automation     |
| TypeScript         | Programming language   |
| Node.js            | Runtime environment    |
| Playwright Test    | Test runner            |
| JSON               | Scenario definition    |
| Gherkin            | BDD support            |
| HTML Report        | Test reporting         |
| GitHub Actions     | Continuous Integration |
| OpenAI API         | AI Auto-Healing        |
| Clean Architecture | Framework design       |

---

# Roadmap

Planned features include:

- AI-generated test cases
- AI-generated locators
- AI-generated assertions
- Visual testing
- Cross-browser execution optimization
- Parallel API execution
- Distributed test execution
- Cloud execution support
- Docker image
- Jenkins pipeline template
- Azure DevOps pipeline
- Allure Report integration

---

# Contributing

Contributions are welcome.

If you would like to improve the framework:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Submit a Pull Request.

Please ensure all tests pass before submitting your contribution.

---

# License

This project is licensed under the MIT License.

Feel free to use, modify, and distribute this framework in accordance with the license terms.

---

# Author

Developed with ❤️ using Playwright, TypeScript, and Clean Architecture.

If you find this project useful, consider giving it a ⭐ on GitHub.
