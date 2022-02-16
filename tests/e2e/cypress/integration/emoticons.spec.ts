/// <reference types="cypress" />

context('Emoticons', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/77627428/Demo+Emoticons+or+emojis',
    ).then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
