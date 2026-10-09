Feature: User Login

Scenario: TC-1 - Verify user can login with valid credentials
Given I am on the login page
When I enter valid email and password
And I click the login button
Then I should be logged in successfully
