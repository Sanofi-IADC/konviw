/// <reference types="cypress" />

context('Apex Charts', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/63862875097/konviw+-+demo+tables+with+charts');
    cy.wait(4000);
    cy.compareSnapshot('apex-charts');
  });
});
