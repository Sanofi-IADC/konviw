/// <reference types="cypress" />

context('Status', () => {
    it('check if it matchs the whole page', () => {
      cy.visit('http://localhost:4000/cpv/wiki/slides/konviw/64146277218#/1/Demo+Slide').then(
        () => {
          cy.document().toMatchImageSnapshot();
        },
      );
  });
});