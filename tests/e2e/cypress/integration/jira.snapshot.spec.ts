/// <reference types="cypress" />

context('Jira snapshot', () => {
    const JIRA_URL = [
      '/wiki/spaces/konviw/pages/64039359788/konviw+-+macro+jira+snapshot',
      '/wiki/spaces/konviw/pages/65041465391/Jira+Spanshots+Macro+Table+filters+with+chart+Macro+Database+page'
    ];
    it('checks if the Jira snapshot is displayed and matches the whole page', () => {
      cy.on('uncaught:exception', () => false);
      JIRA_URL.forEach((url, index) => {
        cy.visit(url);
        if (index === 0) {
          cy.get('div.gridjs.gridjs-container').should('be.visible');
        } else {
          cy.get('h1').should('exist');
        }
        cy.compareSnapshot(`jira-snapshot-${index + 1}`);
      });
    });
  });
