/// <reference types="cypress" />

context('Fix Profile Picture', () => {
  it('match profile picture if exist', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/249528321/Demo+Speakers+Picture+Profile+-+With+image').then(
      () => {
        cy.get('.error').should('not.be.undefined');
        cy.document().toMatchImageSnapshot();
      },
    );
  });
  it('remove profile picture if doesnt exist', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/249397249/Demo+Speakers+Picture+Profile+-+Without+image').then(
      () => {
        cy.get('.error').should('not.be.undefined');
        cy.document().toMatchImageSnapshot();
      },
    );
  });
});
