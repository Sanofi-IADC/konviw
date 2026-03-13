/// <reference types="cypress" />

context('Code', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/77627557/Demo+JavaScript');
    cy.viewport(1200, 800);
    cy.compareSnapshot('code');
  });
});
