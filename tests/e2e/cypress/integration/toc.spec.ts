/// <reference types="cypress" />

context('Table Of Content', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/493289709',
    );
    cy.compareSnapshot('toc');
  });
});
