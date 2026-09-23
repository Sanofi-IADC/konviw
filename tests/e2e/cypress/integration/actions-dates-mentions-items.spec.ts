/// <reference types="cypress" />

context('Actions, dates and mentions', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/konviw/pages/763068532/konviw+-+demo+action+items',
    );
    cy.compareSnapshot('actions-dates-mentions-items');
  });
});
