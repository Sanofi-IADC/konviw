/// <reference types="cypress" />

context('Layouts Three Columns', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/67522332220/konviw+-+demo+3+columns+layout+Test+Copy',
    );
    cy.compareSnapshot('layouts-three-columns');
  });
});
