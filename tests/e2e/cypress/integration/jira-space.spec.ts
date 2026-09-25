/// <reference types="cypress" />

context('Jira space', () => {
  it('check jira space link and match the whole page', () => {
    cy.visit('/wiki/spaces/konviw/pages/67523052651/konviw+-+demo+jira+macro+dynamic+table+Test+Copy');
    cy.wait(2000);
    cy.get('a[href*="atlassian"]').should('exist');
    cy.compareSnapshot('jira-space');
  });
});
