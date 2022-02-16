/// <reference types="cypress" />

context('Layouts Three Columns', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/191299585/Demo+Layouts+Three+columns+layout',
    ).then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
