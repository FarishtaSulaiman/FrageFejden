describe('Login as teacher', () => {
  it('should log in and redirect to the teacher dashboard', () => {
    //sida att besöka
    cy.visit('http://localhost:5173/');
    //letar efter element med texten Logga in och klickar på den
    cy.contains('Logga in').click();
    //Väntar på att login modal ska visas
    cy.get('[data-testid="login-modal"]').should('be.visible');
    //Fyller i email och lösenord, letar endast efter fälten i modalen
    cy.get('[data-testid="login-modal"]').within(() => {
      cy.get('input[name="emailOrUserName"]').clear().type('olof.teacher@school.edu');
      cy.get('input[name="password"]').clear().type('Password123!');
      //Klickar på knappen för att skicka in formuläret
      cy.get('button[type="submit"]').click();
    });
    //Verifierar att användaren har omdirigerats till dashboard-sidan
    cy.url().should('include', '/teacher/klassvy');
    //Verifierar att ett element med texten "Prestationer" finns på sidan
    cy.contains('Lärarvy').should('be.visible');

  });
});