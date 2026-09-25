/// <reference types="cypress" />

context('Fix Profile Picture', () => {
  it('match profile picture if exist', () => {
    cy.visit('/wiki/spaces/konviw/pages/67522397917/konviw+-+demo+macro+user+profile+Test+Copy');
    cy.get('.error').should('not.be.undefined');
    cy.compareSnapshot('fix-profile-picture-error-1');
  });
  it('remove profile picture if doesnt exist', () => {
    cy.visit('/wiki/spaces/konviw/pages/67522397917/konviw+-+demo+macro+user+profile+Test+Copy');
    cy.get('.error').should('not.be.undefined');
    cy.compareSnapshot('fix-profile-picture-error-2');
  });
});
