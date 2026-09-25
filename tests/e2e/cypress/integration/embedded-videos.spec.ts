/// <reference types="cypress" />

context('Embedded videos', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/67522692960/konviw+-+demo+embedded+videos+Test+Copy',
    );
    cy.wait(4000);
    cy.compareSnapshot('embedded-videos');
  });
});
