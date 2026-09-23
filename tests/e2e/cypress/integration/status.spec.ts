/// <reference types="cypress" />

context('Status', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/770408500/konviw+-+demo+status');
    cy.compareSnapshot('status');
  });
});
