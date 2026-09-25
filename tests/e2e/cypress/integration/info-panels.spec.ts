/// <reference types="cypress" />

context('Info panels', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/67521906600/konviw+-+demo+info+panels+Test+Copy');
    cy.viewport(1280, 720);
    cy.compareSnapshot('info-panels');
  });
});
