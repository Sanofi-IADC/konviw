/// <reference types="cypress" />

context('Images', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/67522659966/konviw+-+demo+images',
    );
    cy.wait(2000);
    cy.compareSnapshot('images');
  });
});
