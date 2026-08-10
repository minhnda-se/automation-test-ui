Feature: Chức năng Đăng nhập hệ thống

Scenario: Đăng nhập thành công với tài khoản chuẩn
  Given I go to "https://www.saucedemo.com/"
  When I fill "standard_user" into "usernameInput" on "LoginPage"
  And I fill "secret_sauce" into "passwordInput" on "LoginPage"
  And I click "loginBtn" on "LoginPage"
  Then I verify "cartIcon" is visible on "InventoryPage"