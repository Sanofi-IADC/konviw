/// <reference types="cypress" />

context('Status', () => {
    it('check if the message is in the last slide', () => {
      cy.visit('/wiki/slides/konviw/62756913390');
      cy.get('section.message').should('have.css', 'display', 'none');
      cy.compareSnapshot('add-message-demo-slide');

      cy.visit('/wiki/slides/konviw/62756913390#/1');
      cy.get('section.message').should('have.css', 'display', 'none');
      cy.compareSnapshot('add-message-slide-1');

      cy.visit('/wiki/slides/konviw/62756913390#/2');
      cy.get('section.message').should('have.css', 'display', 'none');
      cy.compareSnapshot('add-message-slide-2');
    });
  });
  