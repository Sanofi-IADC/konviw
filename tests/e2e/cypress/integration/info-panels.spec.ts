/// <reference types="cypress" />

context('Info panels', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/77660239/Demo+Info+Panels').then(() => {
      cy.viewport(1280, 720)
      cy.document().toMatchImageSnapshot();
    });
  });
});
