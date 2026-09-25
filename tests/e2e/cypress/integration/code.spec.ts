/// <reference types="cypress" />

context('Code', () => {
  it('match the whole page', () => {
    cy.on('uncaught:exception', (err) => !err.message.includes('hljs'));
    cy.visit('/wiki/spaces/konviw/pages/67522299739/CPV+tests+-+code+Test+Copy');
    cy.viewport(1200, 800);
    cy.compareSnapshot('code');
  });
});
