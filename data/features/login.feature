# Compiled by: npm run compile-bdd
# The BDD compiler is FROZEN at six step patterns - see scripts/compile-bdd.ts.
# Anything those six cannot express belongs in a JSON scenario instead.
Feature: User login

Scenario: Successful login with a standard account
  Given I go to "https://www.saucedemo.com/"
  When I fill "standard_user" into "usernameInput" on "LoginPage"
  And I fill "secret_sauce" into "passwordInput" on "LoginPage"
  And I click "loginBtn" on "LoginPage"
  Then I verify "cartIcon" is visible on "InventoryPage"
