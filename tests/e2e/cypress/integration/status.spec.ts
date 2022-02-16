/// <reference types="cypress" />

context('Status', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/77561880/Demo+Status+labels').then(
      () => {
        cy.document().toMatchImageSnapshot();
      },
    );
  });
});
