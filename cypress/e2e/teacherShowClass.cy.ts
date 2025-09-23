describe('Show class', () => {
  //automatisk inloggning
    beforeEach(() => {
    cy.teacherLogin();
    cy.visit('/teacher/klassvy');
  });
it('Should let teacher choose a certain class through the dropdown', () => {
cy.contains('Välj klass');
cy.get('select[aria-label="SetClassName"]').should('contain', '9C');
cy.get('select[aria-label="SetClassName"]').select('9C')
cy.contains('Elever – 9C').should('be.visible');
//kontrollerar att minst en elev renderas i listan
cy.get('h3').contains('Elever – 9C') 
  .parent() 
  .find('ul')
  .find('li') 
  .should('have.length.greaterThan', 0);
  });
});