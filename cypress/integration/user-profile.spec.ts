/// <reference types="cypress" />

context('User profile', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/77594849/Demo+User+Profiles').then(
      () => {
        cy.document().toMatchImageSnapshot();
      },
    );
  });
});
