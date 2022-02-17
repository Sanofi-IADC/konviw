/// <reference types="cypress" />

context('Apex Charts', () => {
  it('match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/185827357/Demo+Charts+Pie').then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
