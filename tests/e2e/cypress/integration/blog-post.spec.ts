/// <reference types="cypress" />

context('Blog post', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/67522955472/Data+products+-+blog+post+Test+Copy?type=blog',
    );
    cy.compareSnapshot('blog-post');
  });
});
