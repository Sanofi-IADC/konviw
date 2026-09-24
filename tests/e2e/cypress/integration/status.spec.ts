/// <reference types="cypress" />

context('Status', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/67523347001/konviw+-+demo+status+Test+Copy');
    cy.compareSnapshot('status');
  });
});
