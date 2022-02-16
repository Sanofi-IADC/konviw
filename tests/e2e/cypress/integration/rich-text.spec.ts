/// <reference types="cypress" />

context('Rich text', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/77627494/Demo+Rich+text').then(() => {
      cy.wait(2000);
      cy.document().toMatchImageSnapshot();
    });
  });
});
