/// <reference types="cypress" />

context('Jira issues', () => {
  it('should render grid container for new jira issues macro and match the whole page', () => {
    cy.on('uncaught:exception', () => false);
    cy.viewport(1200, 800);
    cy.visit('/wiki/spaces/konviw/pages/64418512933/konviw+-+demo+New+Jira+Issues');
    cy.wait(2000);
    cy.get('table.jiraWorkItemMacroListViewTable').should('exist');
    cy.compareSnapshot({ name: 'jira-issues', cypressScreenshotOptions: { capture: 'viewport' } });
  });
});
