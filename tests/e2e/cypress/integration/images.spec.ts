/// <reference types="cypress" />

context('Images', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/191299661/Demo+Media+content+Images',
    );
    cy.wait(2000);
    cy.compareSnapshot('images');
  });
});
