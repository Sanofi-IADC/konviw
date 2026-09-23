/// <reference types="cypress" />

context('Rich text', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/770441267/konviw+-+demo+rich+text+format');
    cy.wait(2000);
    cy.compareSnapshot('rich-text');
  });
});
