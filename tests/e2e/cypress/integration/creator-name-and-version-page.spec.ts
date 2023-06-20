/// <reference types="cypress" />

context('Check if the header is displayed', () => {
    it('the header should display correctly', () => {
      cy.visit(
        '/wiki/spaces/KONVIW/pages/240418817/Demo+Author+and+Page+version',
      ).then(() => {
        cy.get('body')
          .find('.author_header')
          .should('have.length', 1)
          .should('be.visible');
        cy.document().toMatchImageSnapshot();
      });
    });
  });
  