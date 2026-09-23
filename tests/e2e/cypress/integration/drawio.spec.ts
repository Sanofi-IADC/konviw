/// <reference types="cypress" />

context('DrawIO', () => {
  it('match the whole page', () => {
    cy.on('uncaught:exception', () => false);
    cy.visit(
      '/wiki/spaces/konviw/pages/769949785/CPV+tests+-+all',
    );
    cy.compareSnapshot('drawio');
  });
});
