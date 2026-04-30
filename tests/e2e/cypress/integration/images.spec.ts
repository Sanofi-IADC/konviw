/// <reference types="cypress" />

context('Images', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/763035809',
    );
    cy.wait(2000);
    cy.compareSnapshot('images');
  });
});
