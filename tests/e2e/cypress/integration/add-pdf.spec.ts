context('Check if the PDF files are well displayed', () => {
    it('match the src attributes of PDF iframes', () => {
      cy.visit('/wiki/spaces/konviw/pages/246153217/Demo-Add-PDF').then(() => {
        cy.get('.conf-macro.output-block')
          .filter('[data-macro-name="viewpdf"]')
          .should('exist')
          .find('div.office-container')
          .find('iframe')
          .should('be.visible')
          .each(($iframe) => {
            const src = $iframe.attr('src');
            expect(src).to.match(/^data:application\/pdf;base64,[A-Za-z0-9+/]+={0,2}$/);
          });
      });
    });
  });