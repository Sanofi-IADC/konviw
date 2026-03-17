/// <reference types="cypress" />

context('Layouts Two Columns', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/769720472',
    );
    cy.compareSnapshot('layouts-two-columns');
  });
});
