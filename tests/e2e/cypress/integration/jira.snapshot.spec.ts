/// <reference types="cypress" />

context('Jira snapshot', () => {
    const JIRA_URL = [
      '/wiki/spaces/KONVIW/pages/237469697/Demo+Jira+Snapshot+with+JQL+Query+key',
      '/wiki/spaces/KONVIW/pages/237371394/Demo+Jira+snapshot+with+project'
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
