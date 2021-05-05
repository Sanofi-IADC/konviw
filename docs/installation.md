---
title: Installation
---

## Manual setup

```bash
➜ git clone https://github.com/Sanofi-IADC/konviw.git

➜ cd konviw && npm install

➜ npm run build

➜ npm run start
```

## Docker setup

- [ ] TODO

## Configuration

Configuration is made with environment variables. They can also be defined with the `.env` file when running locally. Check the `.env.example` for an example of environment file.

- `NODE_ENV`: `development`, `test` or `production`. Default: `production`
- `CPV_BASEPATH`: the base path where the app is exposed. Useful when exposed behind a reverse proxy. Used to generate links. Default: `/` (but defined as `/cpv` in production)
- `CPV_BASEHOST`: the domain URL to compose full URL to resolve images and links from the API, like https://www.example.com. **Required**
- `CPV_CONFLUENCE_BASE_URL`: Confluence server base URL. **Required**
- `CPV_CONFLUENCE_API_USERNAME`: Confluence API username (usually an email address). **Required**
- `CPV_CONFLUENCE_API_TOKEN`: Confluence API token (can be created [here](https://id.atlassian.com/manage/api-tokens)). **Required**
- `CPV_MATOMO_BASE_URL`: Matomo server base URL. _Optional_
- `CPV_MATOMO_ID_SITE`: Id of the Confluence public viewer site in Matomo. _Optional_
- `CPV_GOOGLE_ANALYTICS`: Tag for tracking web analytics vis Google Analytics. _Optional_

## Development

1. Clone the repo:

```bash
➜ git clone https://github.com/Sanofi-IADC/konviw.git
```

2. Install packages:

```bash
➜ cd konviw && npm install
```

3. Create an Atlassian API token: https://id.atlassian.com/manage/api-tokens

4. Copy `.env.example` to `.env` and edit your configuration.

5. Run the server in watch mode:

```bash
➜ npm run start:dev
```

6. You can use the proxy on `http://localhost:3000/`

## Documentation

We use [VuePress](https://vuepress.vuejs.org/) to maintain and publish the konviw online documentation.
Check them locally with

```bash
➜ npm run docs:dev
```

and deploy them in Github pages with

```bash
➜ npm run docs:deploy
```

## Advance Customizing

You can furher customize the way the pages are rendered and the default styles applying your own stylesheets.

In the folder `src/assets/scss` you will find all the scss stylesheets organized by formating group.

For instance editing the file `expander-panel.scss` you can personalize the style for your expander panels. Whether you prefer arrows instead of `+` / `-` symbols or change text size or color.

```js
// Expander pannel ========================================
div.expand-container {
  border-radius: 10px;
  border: solid 1px var(--border-expander);
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 5px;
  background-color: var(--bg-expander);
}
div.expand-control:before {
  content: "\2795"; // symbol +
}
div.active:before {
  content: "\2796"; // symbol -
}
div.expand-control {
  cursor: pointer;
  padding: 10px;
  font-size: 20px;
  font-weight: 400;
}
div.expand-control:hover {
  background-color: var(--border-expander);
  border-radius: 10px;
}
span.expand-control-text {
  padding: 5px;
  word-wrap: break-word;
  white-space: normal;
}
div.expand-content {
  transition: max-height 0.3s ease-out;
  font-size: 18px;
  padding: 0 18px;
  max-height: 0;
  overflow: hidden;
}
```

As you see we use CSS variables for the most common styles shared across components. You can access and modify all those variables from the file `variables.scss`.

## Tests


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
const expectedResult = 20 // according to the context
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
`

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
    let title = 'I am the Title'
    context.setTitle(title);
    context.setHtmlBody(example);
    // 2. Set the expected result
    const expectedResult = `<h1 class="titlePage">${title}</h1>`
    // 3. Execute the code to test
    step(context);
    // 4. Make the assertion
    expect(context.getHtmlBody()).toContain(expectedResult);
  });
});
```

And that's it 😉.
