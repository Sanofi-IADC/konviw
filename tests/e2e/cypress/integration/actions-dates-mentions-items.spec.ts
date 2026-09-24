/// <reference types="cypress" />

context('Actions, dates and mentions', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/67521251973/konviw+-+demo+action+items+Test+Copy',
    );
    cy.compareSnapshot('actions-dates-mentions-items');
  });
});
