/// <reference types="cypress" />

context('Table Of Content', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/191660058/Demo+Toc+For+Cypress+Test',
    ).then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
