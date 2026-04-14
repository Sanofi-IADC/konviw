/// <reference types="cypress" />

context('Emoticons', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/763101479',
    );
    cy.compareSnapshot('emoticons');
  });
});
