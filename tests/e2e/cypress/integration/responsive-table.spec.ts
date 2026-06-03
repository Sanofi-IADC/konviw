/// <reference types="cypress" />

context('Check responsive table', () => {
    it('should display correctly on mobile view', () => {
      cy.visit(
        '/wiki/spaces/KONVIW/pages/64770834517',
      );
      cy.viewport(400, 800);
      cy.compareSnapshot('responsive-table');
    });
  });
  