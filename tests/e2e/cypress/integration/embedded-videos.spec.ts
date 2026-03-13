/// <reference types="cypress" />

context('Embedded videos', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/191266853/Demo+Media+content+Embedded+Video',
    );
    cy.wait(4000);
    cy.compareSnapshot('embedded-videos');
  });
});
