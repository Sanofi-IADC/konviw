/// <reference types="cypress" />

context('Decisions', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/769654887/konviw+-+demo+decisions');
    cy.compareSnapshot('decisions');
  });
});
