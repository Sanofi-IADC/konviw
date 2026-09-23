/// <reference types="cypress" />

context('Jira space', () => {
  it('check jira space link and match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/64770834517/konviw+-+demo+jira+macro+dynamic+table');
    cy.wait(2000);
    cy.get('a').should('exist');
    cy.compareSnapshot('jira-space');
  });
});
