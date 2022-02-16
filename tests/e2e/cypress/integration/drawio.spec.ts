/// <reference types="cypress" />

context('DrawIO', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/191299598/Demo+Media+content+Draw.io',
    ).then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
