describe('check statistics for students', () => {
  //automatisk inloggning
    beforeEach(() => {
    cy.teacherLogin();
    cy.visit('/teacher/klassvy');
  });
  it('Should let teacher go to statistics page and see differnt statistics and sort by class', () => {
    cy.contains('Lärarvy').should('be.visible');
    cy.contains('button', 'teacher:').click();
    cy.contains('Hej').should('be.visible');
    cy.contains('button', 'Quiz Statistik').click();
    cy.url().should('include', 'teacherQuizStatistics');
    cy.contains('Genomsnitt svar per elev');
    cy.get('[data-testid="class-select"]').select('9C');
  });
});