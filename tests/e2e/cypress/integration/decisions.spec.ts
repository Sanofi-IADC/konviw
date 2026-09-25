/// <reference types="cypress" />

context('Decisions', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/67522823807/konviw+-+demo+decisions+Test+Copy');
    cy.compareSnapshot('decisions');
  });
});
