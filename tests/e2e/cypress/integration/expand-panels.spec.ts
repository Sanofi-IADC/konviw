/// <reference types="cypress" />

context('Expand Panels', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/762904807');
    cy.compareSnapshot('expand-panels');
  });
});
