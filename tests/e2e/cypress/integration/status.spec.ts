/// <reference types="cypress" />

context('Status', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/770408500');
    cy.compareSnapshot('status');
  });
});
