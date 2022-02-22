/// <reference types="cypress" />

context('Decisions', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/77561890/Demo+Decisions').then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
