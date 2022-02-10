/// <reference types="cypress" />

context('Expand Panels', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/77561961/Demo+Expand+panels').then(
      () => {
        cy.document().toMatchImageSnapshot();
      },
    );
  });
});
