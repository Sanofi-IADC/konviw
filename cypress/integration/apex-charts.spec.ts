/// <reference types="cypress" />

context('Apex Charts', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/185794678/Demo+Charts+Dashboard').then(
      () => {
        cy.document().toMatchImageSnapshot();
      },
    );
  });
});
