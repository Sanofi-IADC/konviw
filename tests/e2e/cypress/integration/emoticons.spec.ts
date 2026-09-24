/// <reference types="cypress" />

context('Emoticons', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/67522005178/konviw+-+demo+emoticons+Test+Copy',
    );
    cy.compareSnapshot('emoticons');
  });
});
