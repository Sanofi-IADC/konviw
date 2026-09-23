/// <reference types="cypress" />

context('Embedded videos', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/769949766/konviw+-+demo+embedded+videos',
    );
    cy.wait(4000);
    cy.compareSnapshot('embedded-videos');
  });
});
