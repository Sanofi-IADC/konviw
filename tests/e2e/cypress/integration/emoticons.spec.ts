/// <reference types="cypress" />

context('Emoticons', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/763101479/konviw+-+demo+emoticons',
    );
    cy.compareSnapshot('emoticons');
  });
});
