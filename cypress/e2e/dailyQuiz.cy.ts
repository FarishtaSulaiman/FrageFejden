

describe('Daily quiz',() => {
  //automatisk inloggning
    beforeEach(() => {
     
    cy.login();
    cy.visit('/studentDashboard');
  });

  //testar att användaren kan skicka svar på dailyquiz om de inte redan gjort det
  //misslyckas om användaren redan gjort det
  it('should start the daily quiz and answer the question', () => {
    
    cy.contains('Prestationer').should('be.visible');
    cy.contains('button', 'Svara på dagens Quiz').click();
    
    cy.contains('button', 'Skicka svar');
    
    cy.get('#daily-option-0').click();
    cy.contains('button', 'Skicka svar').click();
    cy.contains(/Rätt|Fel/).should('be.visible');

  });

  //Testar så att användaren inte kan svara igen om användaren redan svarat idag
  it('visar låst quiz om användaren redan har svarat', () => {
    cy.visit('/studentDashboard');
    cy.contains('button', 'Svara på dagens Quiz').click();
    cy.contains('Du har redan svarat idag').should('be.visible');
    cy.get('input[name="daily-option"]').should('be.disabled');
    cy.contains('button', 'Skicka svar').should('be.disabled');
  });
});
