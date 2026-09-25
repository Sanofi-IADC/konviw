context('Check if the PDF files are well displayed', () => {
    it('match the src attributes of PDF iframes', () => {
      cy.visit('/wiki/spaces/konviw/pages/67522660156/konviw+-+demo+embedded+files+Test+Copy');
      cy.get('.conf-macro[data-macro-name="view-file"]')
        .filter('[data-macro-name="view-file"]')
        .should('exist');
      cy.get('a[data-mime-type="application/pdf"]').should('exist');
      cy.get('iframe').should('have.attr', 'src').and('not.be.empty');
      cy.compareSnapshot('add-pdf');
    });
  });