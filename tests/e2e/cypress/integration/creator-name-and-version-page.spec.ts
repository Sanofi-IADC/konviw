/// <reference types="cypress" />

context('Check if the header is displayed', () => {
    it('the header should display correctly', () => {
      cy.visit(
        '/wiki/spaces/konviw/pages/67523052617/konviw+-+demo+rich+text+format?type=title,author',
      );
      cy.get('body').find('.author_header').should('have.length', 1).should('be.visible');
      cy.compareSnapshot('creator-name-and-version-page');
    });
  });
  