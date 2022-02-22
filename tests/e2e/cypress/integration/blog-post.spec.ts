/// <reference types="cypress" />

context('Blog post', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/191365134/Demo+Blog+Post?type=blog',
    ).then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
