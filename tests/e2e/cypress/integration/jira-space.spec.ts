/// <reference types="cypress" />

context('Jira spaces', () => {
  it('check jira space link and match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/237142017/Demo+Jira+Space',
    ).then(() => {
      cy.wait(2000);
      cy.document().toMatchImageSnapshot();
    });
  });
});
