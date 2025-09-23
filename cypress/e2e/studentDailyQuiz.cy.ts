

describe('Daily quiz',() => {
  //automatisk inloggning
    beforeEach(() => {
     
    cy.login();
    cy.visit('/studentDashboard');
  });

  //testar att användaren kan skicka svar på dailyquiz
  //Mockar att skicka in ett svar för att kunna köra testet flera ggr
  it('should start the daily quiz and answer the question', () => {
    cy.contains('Prestationer').should('be.visible');
    cy.contains('button', 'Svara på dagens Quiz').click();
    cy.contains('button', 'Skicka svar');
    cy.get('#daily-option-0').click();
    cy.intercept('POST', '/api/daily/answer', (req) => {
      
      // Returnerar ett mockat svar ingen request skickas till backend
      req.reply({
        statusCode: 200,
        body: {
          correct: true,
          message: 'Rätt svar!',
        },
      });
    });
    cy.contains('button', 'Skicka svar').click();
    cy.contains(/Rätt|Fel/).should('be.visible');

  });

  //Testar så att användaren inte kan svara igen om användaren redan svarat idag
  //Mockar att ett quiz är svarat på för att få ett konsekvent test
  it('visar låst quiz om användaren redan har svarat', () => {
    cy.visit('/studentDashboard');
        cy.intercept('GET', '/api/daily', (req) => {

      // Returnerar ett mockat svar ingen request skickas till backend
      req.reply({
        statusCode: 200,
        body: {
          Date: new Date().toISOString().slice(0, 10),
          questionId: 39,
          category: "Naturvetenskap",
          question: "Vilket grundï¿½mne har kemiska beteckningen O?",
          alternativ: [
        "Syre",
        "Vï¿½te",
        "Kvï¿½ve",
        "Kol"
    ],
    "answered": true
        },
      });
    });
    cy.contains('button', 'Svara på dagens Quiz').click();
    cy.contains('Du har redan svarat idag.').should('be.visible');
    cy.get('input[name="daily-option"]').should('be.disabled');
    cy.contains('button', 'Skicka svar').should('be.disabled');
  });
});
