/// <reference types="cypress" />

context('Status', () => {
    it('check if the message is in the last slide', () => {
      cy.on('uncaught:exception', () => false);
      cy.visit('wiki/slides/konviw/67521710691#/Demo-Slide');
      cy.get('section.message').should('have.css', 'display', 'none');
      cy.compareSnapshot('add-message-demo-slide');

      cy.visit('wiki/slides/konviw/67521710691#/1');
      cy.get('section.message').should('have.css', 'display', 'none');
      cy.compareSnapshot('add-message-slide-1');

      cy.visit('wiki/slides/konviw/67521710691#/2');
      cy.get('section.message').should('have.css', 'display', 'block');
      cy.compareSnapshot('add-message-slide-2');
    });
  });
  