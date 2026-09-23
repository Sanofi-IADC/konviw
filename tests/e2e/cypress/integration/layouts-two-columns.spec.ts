/// <reference types="cypress" />

context('Layouts Two Columns', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/769720472/konviw+-+demo+2+columns+layout',
    );
    cy.compareSnapshot('layouts-two-columns');
  });
});
