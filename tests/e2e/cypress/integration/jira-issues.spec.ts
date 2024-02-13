/// <reference types="cypress" />

context('Jira issues', () => {
    it('check jira space link and match the whole page', () => {
      cy.visit(
        '/wiki/spaces/KONVIW/pages/345931777/Demo+Jira+Issues',
      ).then(() => {
        cy.wait(2000);
        cy.get('grid,gridjs-container')
          .then((container) => expect(Boolean(container)).to.be.true)
          .then(() => {
            cy.document().toMatchImageSnapshot();
          });
      });
    });
  });
  