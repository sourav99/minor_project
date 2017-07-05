import { WhatsauthCPage } from './app.po';

describe('whatsauth-c App', () => {
  let page: WhatsauthCPage;

  beforeEach(() => {
    page = new WhatsauthCPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
