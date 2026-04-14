/// <reference types="cypress" />

context('Embedded videos', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/769949766',
    );
    cy.wait(4000);
    cy.compareSnapshot('embedded-videos');
  });
});
