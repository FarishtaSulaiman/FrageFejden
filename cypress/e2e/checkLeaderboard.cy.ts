describe('Check leaderboard', () => {
    beforeEach(() => {
        cy.login();
        cy.visit('/studentDashboard');
    });

    it('should be able to check your leaderboard standing', () => {
        cy.contains('Prestationer').should('be.visible');
        cy.contains('button', 'Prestationer').click();
        cy.url().should('include', '/leaderboard');
        //kollar rubriker eftersom alla andra värden kan ändras
        cy.contains('MINA RESULTAT').should('be.visible');
        cy.contains('ÄMNE').should('be.visible');
        cy.contains('TOPPLISTA').should('be.visible');
    })
})