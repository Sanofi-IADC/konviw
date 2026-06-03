/// <reference types="cypress" />

context('Fix Profile Picture', () => {
  it('match profile picture if exist', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/763101592');
    cy.get('.error').should('not.be.undefined');
    cy.compareSnapshot('fix-profile-picture-error-1');
  });
  it('remove profile picture if doesnt exist', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/763101592');
    cy.get('.error').should('not.be.undefined');
    cy.compareSnapshot('fix-profile-picture-error-2');
  });
});
