/// <reference types="cypress" />

context('Table Of Content', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/191266846/Demo+Toc#[h1]-Header-1-Fail',
    ).then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
