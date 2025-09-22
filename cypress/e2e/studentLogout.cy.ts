describe('Daily quiz',() => {
  //automatisk inloggning
    beforeEach(() => {
    cy.login();
    cy.visit('/studentDashboard');
  });
  it('Should logout user when pressing logout button', () => {
    cy.contains('button', 'Prestationer');
    cy.contains('button', 'Användare:').click();
    cy.contains('Hej');
    cy.contains('button', 'Logga ut').click();
    cy.url().should('include', '/localhost:5173');
    cy.contains('Logga in').should('be.visible');
  });
});