/// <reference types="cypress" />

context('Expand Panels', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/762904807/konviw+-+demo+expand');
    cy.compareSnapshot('expand-panels');
  });
});
