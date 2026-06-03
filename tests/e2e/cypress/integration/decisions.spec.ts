/// <reference types="cypress" />

context('Decisions', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/769654887');
    cy.compareSnapshot('decisions');
  });
});
