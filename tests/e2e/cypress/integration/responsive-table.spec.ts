/// <reference types="cypress" />

context('Check responsive table', () => {
    it('should display correctly on mobile view', () => {
      cy.visit(
        '/wiki/spaces/konviw/pages/67522528854/konviw+-+demo+new+tables+Test+Copy',
      );
      cy.viewport(400, 800);
      cy.compareSnapshot('responsive-table');
    });
  });
  