/// <reference types="cypress" />

context('DrawIO', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/56231794575',
    );
    cy.compareSnapshot('drawio');
  });
});
