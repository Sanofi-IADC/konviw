/// <reference types="cypress" />

context('Jira issues', () => {
  it('should render grid container for new jira issues macro and match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/345931777/Demo+Jira+Issues');
    cy.wait(2000);
    cy.get('grid,gridjs-container').then((container) => expect(Boolean(container)).to.be.true);
    cy.compareSnapshot('jira-issues');
  });
});
