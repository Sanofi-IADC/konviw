/// <reference types="cypress" />

context('Layouts Three Columns', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/763101857/konviw+-+demo+3+columns+layout',
    );
    cy.compareSnapshot('layouts-three-columns');
  });
});
