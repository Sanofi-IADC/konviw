/// <reference types="cypress" />

context('Apex Charts', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/63862875097');
    cy.wait(4000);
    cy.compareSnapshot('apex-charts');
  });
});
