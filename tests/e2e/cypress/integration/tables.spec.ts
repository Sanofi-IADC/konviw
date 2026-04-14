/// <reference types="cypress" />

context('Tables', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/770080825');
    cy.compareSnapshot('tables');
  });
});
