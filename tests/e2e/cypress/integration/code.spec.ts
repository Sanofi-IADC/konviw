/// <reference types="cypress" />

context('Code', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/77627557/Demo+JavaScript').then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
