---
title: Testing
---

## Unit Tests with Jest

### Introduction

We use [**Jest**](https://jestjs.io/) to implement our unit tests. We will show you our unit testing **strategy** for testing the **Steps**, with an example.

**Reminder:** Unit tests are developers oriented tests. Their purposes are:

- To let developers add new functionnalities without breaking something
- To make good documentation of what a component should do
- Ensure that an isolated component is working as expected
- Ensure the code is maintenable and well written (a bad code is difficult to test)

### Strategy

A classic unit test is done this way:

1. Set up a context
2. Set the expected result for the context
3. Execute the piece of code we want to test on the context
4. Check if the result is the expected

Example with a function:

```js
function multiplication(a: number, b: number) {
  return a * b;
}
```

First set the context

```js
const a = 2;
const b = 10;
```

Then the expected result

```js
const expectedResult = 20; // according to the context
```

Finally, call the function and check the result

```js
const result = multiplication(a, b);
expect(result).toBe(expectedResult);
```

This is **straightforward**, and actually this kind of strategy is enough for testing **90%** of your code. If not, maybe you should refactor/review your code.
If you are not able to easily unit test a component, very often it's because the component does too many things (**SOLID principle**), or it does it in a too much complex way.

---

We will do the same for testing our **Steps**:

1. Make a html code with minimal useful content for the step (set up the context)
2. Make a html code we expect to the Step to produce (the expected result)
3. Finally, execute the Step on our context and check the result

### Example

Consider the following Step:

```ts
export default (): Step => {
  return (context: ContextService): void => {
    const $ = context.getCheerioBody();
    if (context.getTitle()) {
      $('#Content').prepend(`<h1 class="titlePage">${context.getTitle()}</h1>`);
    }
  };
};
```

This Step put a heading tag _h1_ at the top of the html page with the title of the page context. So let's test it:

```ts
// 1. Set up the context: Minimal html code needed
const example = `
<html>
  <head></head>
  <body>
      <div id="Content">
        <p>Test !</p>
      </div>
  </body>
</html>
`;

describe('addHeaderTitle', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);

    context.Init('XXX', '123456', 'dark');
  });

  it('should add the h1 title', () => {
    const step = addHeaderTitle();
    // 1. Set up the context: Set the ContextService config
    let title = 'I am the Title';
    context.setTitle(title);
    context.setHtmlBody(example);
    // 2. Set the expected result
    const expectedResult = `<h1 class="titlePage">${title}</h1>`;
    // 3. Execute the code to test
    step(context);
    // 4. Make the assertion
    expect(context.getHtmlBody()).toContain(expectedResult);
  });
});
```

And that's it 😉.

## E2E Visual Tests with Cypress

### Introduction

We use [**Cypress**](https://www.cypress.io/) and the plugin [**cypress-plugin-snapshots**](https://github.com/meinaart/cypress-plugin-snapshots) to implement our end-to-end visual tests. We will see here our visual testing **strategy** for testing the confluence **pages** through a running version of Konviw, with an example.

### Strategy

E2E Visual Tests consists of taking snapshots of each pages the first time you run the tests, then you need to add and commit the generated snapshots to git.
Then each time a Pull Request is created or a PR is merged in master, github will trigger the Cypress Tests workflow which run the cypress tests against the running version of konviw on vercel: https://konviw.vercel.app/cpv.

Cypress will compare each commited snapshots with the running konviw pages on vercel and will fail in case the snapshot doesn't match the live page.


### Example

1. Create your confluence page for visual testing and get the ID of the page
2. Create your test in `tests/e2e/cypress/integration/[YOUR_TEST].spec.ts`
```ts
/// <reference types="cypress" />

context('Example', () => {
  it('match the whole page', () => {
    cy.visit(
      '/wiki/spaces/KONVIW/pages/[PAGE_ID]/Example',
    ).then(() => {
      cy.document().toMatchImageSnapshot();
    });
  });
});
```
3. Run the tests with cypress
```bash
# In order to run the tests against an URL, you will need to execute this command with the correct URL for CYPRESS_BASE_URL
# By default it will take the URL specified in cypress.json
CYPRESS_BASE_URL=https://konviw.vercel.app/cpv npm run cypress:run
```

You can also run the GUI version:
```bash
CYPRESS_BASE_URL=https://konviw.vercel.app/cpv npm run cypress:open
```

It will generate any new snapshot for new tests you've added.

4. Add these snapshots to git and commit

### Update snapshots

In case you've added some changes which break an existing test, you need to delete the snapshot and re-run the tests to update the snapshot:

```bash
# 1. Delete the snapshot
rm -f tests/e2e/cypress/integration/__image_snapshots__/Example.png

# 2. Re-run the test
CYPRESS_BASE_URL=https://konviw.vercel.app/cpv npm run cypress:run

# 3. Add, commit & push
git add tests/e2e/cypress/integration/__image_snapshots__/Example.png
git commit -m "fix: test"
git push
```