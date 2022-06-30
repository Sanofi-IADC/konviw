/// <reference types="cypress" />

context('Tables', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/77627467/Demo+Tables').then(() => {
      // cy.viewport(1280, 768)
      // cy.document().toMatchImageSnapshot();
    });
  });
});
