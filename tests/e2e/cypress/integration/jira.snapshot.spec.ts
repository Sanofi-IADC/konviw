/// <reference types="cypress" />

context('Jira snapshot', () => {
    const JIRA_URL = [
      '/wiki/spaces/konviw/pages/67521808413/konviw+-+macro+jira+snapshot+Test+Copy',
      '/wiki/spaces/konviw/pages/67522201209/Test+Table+Filter+and+Charts+for+Confluence'
    ];
    it('checks if the Jira snapshot is displayed and matches the whole page', () => {
      cy.on('uncaught:exception', (err) => !err.message.includes('gridjs'));
      JIRA_URL.forEach((url, index) => {
        cy.visit(url);
        cy.get('h1').should('exist');
        cy.compareSnapshot(`jira-snapshot-${index + 1}`);
      });
    });
  });
