/// <reference types="cypress" />

context('Actions, dates and mentions', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/77660200/Demo+Actions+dates+and+mentions',
    ).then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
