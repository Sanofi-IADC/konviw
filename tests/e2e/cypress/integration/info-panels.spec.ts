/// <reference types="cypress" />

context('Info panels', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/763101349/konviw+-+demo+info+panels');
    cy.viewport(1280, 720);
    cy.compareSnapshot('info-panels');
  });
});
