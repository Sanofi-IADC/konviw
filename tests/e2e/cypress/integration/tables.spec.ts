/// <reference types="cypress" />

context('Tables', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/67522234082/konviw+-+demo+tables');
    cy.compareSnapshot('tables');
  });
});
