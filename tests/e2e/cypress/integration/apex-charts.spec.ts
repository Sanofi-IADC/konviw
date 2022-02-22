/// <reference types="cypress" />

context('Apex Charts', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/191660033/Demo+Charts+Pie+For+Cypress+Test').then(() => {
      cy.wait(4000);
      cy.document().toMatchImageSnapshot();
    });
  });
});
