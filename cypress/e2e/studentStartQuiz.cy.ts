describe('Start quiz', () => {
  //automatisk inloggning
    beforeEach(() => {
    cy.login();
    cy.visit('/studentDashboard');
  });
  //Förväntningar på vad som ska hända
  it('should start a quiz from dashboard and answer the questions', () => {
    cy.contains('Prestationer').should('be.visible');
    cy.get('[data-testid="starta-quiz-btn"]').click();
    cy.url().should('include', '/QuizVyStudent');
    cy.contains('Klassmedlemmar').should('be.visible');
    cy.contains('button', 'Matematik').click();
    cy.contains('Välj din kurs').should('be.visible');
    cy.contains('button', 'Algebra').click();
    cy.contains('button', 'Bekräfta val').click();
    cy.url().should('include','/topics');
    cy.contains('Du har valt kursen');
    cy.get('button[aria-label="Nivå 1"]').click();
    cy.get('button').eq(3).click();
    cy.contains('button', 'Bekräfta svar').click();
    cy.contains('button', 'Nästa fråga').click();
    cy.get('button').eq(2).click();
    cy.contains('button', 'Bekräfta svar').click();
    cy.contains('button', 'Nästa fråga').click();
    cy.get('button').eq(2).click();
    cy.contains('button', 'Bekräfta svar').click();
    cy.contains('button', 'Avsluta').click();
    cy.contains('button', 'Tillbaka').click();

  });
});