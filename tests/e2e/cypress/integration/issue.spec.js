/// <reference types="cypress" />

context('Info panels', () => {
    it('match the whole page', () => {
      cy.visit('/wiki/spaces/KONVIW/pages/195887105').then(() => {
        cy.viewport(1280, 720)
        cy.document().toMatchImageSnapshot();
      });
    });
  });
