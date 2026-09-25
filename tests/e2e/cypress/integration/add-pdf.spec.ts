context('Check if the PDF files are well displayed', () => {
    it('checks PDF attachment links are rendered by the view-file macro', () => {
      cy.visit('/wiki/spaces/konviw/pages/67522660156/konviw+-+demo+embedded+files+Test+Copy');
      cy.get('.conf-macro[data-macro-name="view-file"]').should('exist');
      cy.get('a[data-mime-type="application/pdf"]')
        .should('exist')
        .and('have.attr', 'href')
        .and('not.be.empty');
      cy.compareSnapshot('add-pdf');
    });
  });