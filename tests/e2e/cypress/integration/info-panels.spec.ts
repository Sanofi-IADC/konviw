/// <reference types="cypress" />

context('Info panels', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/763101349');
    cy.viewport(1280, 720);
    cy.compareSnapshot('info-panels');
  });
});
