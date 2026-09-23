/// <reference types="cypress" />

context('Check responsive table', () => {
    it('should display correctly on mobile view', () => {
      cy.visit(
        '/wiki/spaces/konviw/pages/65377076489/konviw+-+demo+new+tables',
      );
      cy.viewport(400, 800);
      cy.compareSnapshot('responsive-table');
    });
  });
  