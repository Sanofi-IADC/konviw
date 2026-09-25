/// <reference types="cypress" />

context('User profile', () => {
  const USER_PROFILE_URL =
    '/wiki/spaces/konviw/pages/67522397917/konviw+-+demo+macro+user+profile+Test+Copy';
  it('checks for the profile image and matches the whole page', () => {
    cy.visit(USER_PROFILE_URL);

    // Chain the commands without using an additional callback function
    cy.get('img.userLogo', { timeout: 2000 }).should('be.visible');
    cy.compareSnapshot('user-profile');
  });
});
