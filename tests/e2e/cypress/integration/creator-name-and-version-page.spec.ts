/// <reference types="cypress" />

context('Check if the header is displayed', () => {
  it('the header should display correctly', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/238354433/Random+Confluence+Page',
    ).then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
