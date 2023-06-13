import { ContextService } from "../../../src/context/context.service";
import { Step } from "../../../src/proxy-page/proxy-page.step";
import addAuthor_Version from "../../../src/proxy-page/steps/addAuthor_Version";
import { createModuleRefForStep } from "./utils";
import { Version } from "../../../src/context/context.interface";
describe("Confluence Proxy / addTheme", () => {
  let context: ContextService;
  let step: Step;

  beforeEach(async () => {
    step = addAuthor_Version();
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.setAuthor("Test");
    context.setAvatar("Test.jpg");
    const mockversion: Version = {
      versionNumber: 2,
      when: "Test",
      modificationBy: {
        displayName: "Test",
        email: "Test@sanofi.com",
        profilePicture: `Test.jpg`,
      },
    };
    context.setLastVersion(mockversion);
  });

  it("should add data-column-id from th to each td (column headers)", () => {
    context.setHtmlBody(
      '<html><head></head><body><div id="Content"><h1 class="titlePage"> Demo table</h1>' +
        "</body></html>"
    );
    step(context);
    expect(context.getHtmlBody()).toMatchInlineSnapshot(`
      "<html><head></head><body><div id=\\"Content\\"><div id=\\"Content\\"><h1 class=\\"titlePage\\"> Demo table</h1><div class=\\"author_header\\"><img src=\\"Test.jpg\\" class=\\"author_image\\"><div class=\\"author_textbox\\">
        <p class=\\"author_text\\">Creator : Test</p><p class=\\"author_text\\">Page version : 2</p></div></div></div></div></body></html>"
    `);
  });
});
