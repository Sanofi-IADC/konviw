/// <reference types="cypress" />

context('Apex Charts', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/67522070463/konviw+-+demo+tables+with+charts');
    cy.wait(4000);
    cy.compareSnapshot('apex-charts');
  });
});
