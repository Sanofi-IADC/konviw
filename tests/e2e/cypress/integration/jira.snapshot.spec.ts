/// <reference types="cypress" />

context('User profile', () => {
    const JIRA_URL = [
      '/wiki/spaces/KONVIW/pages/64075268842/Jira+Snapshot+with+JQL+Query+key',
      '/wiki/spaces/KONVIW/pages/1727008116/Jira+Snapshot+with+JQL+Project+in'
    ];
  
    it('checks if the Jira snapshot is displayed and matches the whole page', () => {
      JIRA_URL.forEach((url) => {
        cy.visit(url);
        cy.get('div.gridjs.gridjs-container', { timeout: 2000 })
          .should('be.visible')
          .then(() => {
            cy.document().toMatchImageSnapshot();
          });
      });
    });
  });
  