/// <reference types="cypress" />

context('Layouts Two Columns', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/67522234272/konviw+-+demo+2+columns+layout+Test+Copy',
    );
    cy.compareSnapshot('layouts-two-columns');
  });
});
