/// <reference types="cypress" />

context('DrawIO', () => {
  it('match the whole page', () => {
    cy.on('uncaught:exception', (err) => !err.message.includes('Zooming'));
    cy.visit(
      '/wiki/spaces/konviw/pages/67523085377/CPV+tests+-+all+Test+Copy',
    );
    cy.compareSnapshot('drawio');
  });
});
