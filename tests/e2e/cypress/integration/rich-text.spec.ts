/// <reference types="cypress" />

context('Rich text', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/67523052617/konviw+-+demo+rich+text+format');
    cy.wait(2000);
    cy.compareSnapshot('rich-text');
  });
});
