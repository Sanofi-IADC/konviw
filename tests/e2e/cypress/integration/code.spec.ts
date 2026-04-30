/// <reference types="cypress" />

context('Code', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/763494466');
    cy.viewport(1200, 800);
    cy.compareSnapshot('code');
  });
});
