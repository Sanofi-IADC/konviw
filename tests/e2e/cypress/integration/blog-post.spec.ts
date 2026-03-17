/// <reference types="cypress" />

context('Blog post', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/63835637628',
    );
    cy.compareSnapshot('blog-post');
  });
});
