/// <reference types="cypress" />

context('Code', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/77627557/Demo+JavaScript').then(() => {
      cy.viewport(1200, 800);
      cy.document().toMatchImageSnapshot();
    });
  });
});
