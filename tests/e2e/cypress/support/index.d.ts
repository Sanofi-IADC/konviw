declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * to Match Image Snapshot
     * @example
     * cy.document().toMatchImageSnapshot()
     */
    toMatchImageSnapshot(): Chainable;

    /**
     * Login Shortcut
     * @example
     * cy.login()
     */
    loginAs<T = any>(role: string): Chainable;
    getToken(): Chainable;
    /**
     * Get an object which has the attribute: data-cy="<name>"
     * @example
     * cy.getElement("author");
     * cy.getElement<Input>("title");
     */
    getElement<K extends keyof HTMLElementTagNameMap>(
      name: string,
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    getElement<E extends Node = HTMLElement>(name: string): Chainable<JQuery<E>>;
    getElement<T = any>(name: string): Chainable<T>;
    /**
     * Finds an object which has the attribute: data-cy="<name>" inside another Element with data-cy="<name>"
     * @example
     * cy.getElementChild("author", "book");
     */
    getElementChild<K extends keyof HTMLElementTagNameMap>(
      parent: string,
      child: string,
    ): Chainable<JQuery<HTMLElementTagNameMap[K]>>;
    getElementChild<E extends Node = HTMLElement>(
      parent: string,
      child: string,
    ): Chainable<JQuery<E>>;
  }
}
