/// <reference types="cypress" />

//Används för att logga in i varje test
Cypress.Commands.add('login', () => {
  cy.visit('/');
  cy.contains('Logga in').click();
  cy.get('[data-testid="login-modal"]').within(() => {
    cy.get('input[name="emailOrUserName"]').clear().type('vik.9c@school.edu');
    cy.get('input[name="password"]').clear().type('Password123!');
    cy.get('button[type="submit"]').click();
  });
  cy.url().should('include', '/studentDashboard');

  
});

// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(): Chainable<void>;
//     }
//   }
// }

export {};