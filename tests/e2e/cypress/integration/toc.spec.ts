/// <reference types="cypress" />

context('Table Of Content', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/67522529016/CPV+tests+-+TOC+Test+Copy',
    );
    cy.compareSnapshot('toc');
  });
});
