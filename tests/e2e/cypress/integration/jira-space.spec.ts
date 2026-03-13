/// <reference types="cypress" />

context('Jira space', () => {
  it('check jira space link and match the whole page', () => {
    cy.visit('/wiki/spaces/KONVIW/pages/237142017/Demo+Jira+Space');
    cy.wait(2000);
    cy.get('a').then((anchor) => expect(anchor.text().trim() === 'Konviw').to.be.true);
    cy.compareSnapshot('jira-space');
  });
});
