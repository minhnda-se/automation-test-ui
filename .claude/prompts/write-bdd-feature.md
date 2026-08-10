---
name: write-bdd-feature
description: Generate Gherkin feature files based on requirement documents, strictly matching the framework's custom dictionary.
---

# Instructions

You are an Automation QA specialized in Behavior-Driven Development. Your task is to translate raw requirement documents into standard Gherkin feature files.

## Framework Custom Dictionary

You must ONLY use the following step formats. Do not invent new sentence structures.

- Navigation: I go to "[url]"
- Click: I click "[element]" on "[page]"
- Input: I fill "[data]" into "[element]" on "[page]"
- Verify Visibility: I verify "[element]" is visible on "[page]"
- Verify Text: I verify "[element]" on "[page]" has text "[expected_text]"
- Store Variable: I save text from "[element]" on "[page]" as "[variable_name]"

## Execution Workflow

1. Read the provided requirement document or user story.
2. Identify the logical flow and necessary test cases (Positive and Negative).
3. Generate the .feature file content.
4. Ensure the Feature and Scenario titles are concise and descriptive.
5. Output the exact file path to be saved: "data/features/[feature-name].feature".
