/// <reference types="cypress" />

context('Layouts Three Columns', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/763101857',
    );
    cy.compareSnapshot('layouts-three-columns');
  });
});
