/// <reference types="cypress" />

context('Check responsive table', () => {
    it('should display correctly on mobile view', () => {
      cy.visit(
        '/wiki/spaces/KONVIW/pages/238354433/Demo+Table+with+different+headers',
      ).then(() => {
        cy.viewport(400,800);
        cy.document().toMatchImageSnapshot();
      });
    });
  });
  