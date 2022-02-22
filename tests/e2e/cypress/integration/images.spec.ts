/// <reference types="cypress" />

context('Images', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/191299661/Demo+Media+content+Images',
    ).then(() => {
      cy.wait(2000);
      cy.document().toMatchImageSnapshot();
    });
  });
});
