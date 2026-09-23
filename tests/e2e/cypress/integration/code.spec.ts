/// <reference types="cypress" />

context('Code', () => {
  it('match the whole page', () => {
    cy.on('uncaught:exception', () => false);
    cy.visit('/wiki/spaces/konviw/pages/763494466/CPV+tests+-+code');
    cy.viewport(1200, 800);
    cy.compareSnapshot('code');
  });
});
