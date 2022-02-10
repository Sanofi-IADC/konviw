/// <reference types="cypress" />

context('Layouts Two Columns', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/191266817/Demo+Layouts+Two+columns+layout',
    ).then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
