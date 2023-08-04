/// <reference types="cypress" />

context('Status', () => {
    it('check if the message is in the last slide', () => {
      cy.visit('wiki/slides/konviw/63878179528#/Demo-Slide').then(
        () => {
          cy.get('section.message')
            .should('have.css','display','none');
          cy.document().toMatchImageSnapshot();
        },
      );
      cy.visit('wiki/slides/konviw/63878179528#/1').then(
        () => {
          cy.get('section.message')
            .should('have.css','display','none');
          cy.document().toMatchImageSnapshot();
        },
      );
      cy.visit('wiki/slides/konviw/63878179528#/2').then(
        () => {
          cy.get('section.message')
            .should('have.css','display','block');
          cy.document().toMatchImageSnapshot();
        },
      );
    });
  });
  