/// <reference types="cypress" />

context('Blog post', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/IADC/pages/988348832/Data+products?type=blog',
    );
    cy.compareSnapshot('blog-post');
  });
});
