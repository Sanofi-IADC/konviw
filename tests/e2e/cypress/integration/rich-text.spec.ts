/// <reference types="cypress" />

context('Rich text', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/770441267');
    cy.wait(2000);
    cy.compareSnapshot('rich-text');
  });
});
