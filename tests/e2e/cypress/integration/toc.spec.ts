/// <reference types="cypress" />

context('Table Of Content', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/493289709/CPV+tests+-+TOC',
    );
    cy.compareSnapshot('toc');
  });
});
