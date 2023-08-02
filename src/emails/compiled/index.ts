import './InviteExistingUserToSite.hbs.js';
import './InviteNewUserToSite.hbs.js';
import Handlebars from 'handlebars/runtime';

type HandlebarsTemplateKey =
  | 'InviteExistingUserToSite.hbs'
  | 'InviteNewUserToSite.hbs';

interface InvitedExistingUserToSiteContext {
  appRootUrl: string;
  email: string;
  siteTitle: string;
}

interface InviteNewUserToSiteContext {
  email: string;
  invitationUrl: string;
  siteTitle: string;
}

type HandlebarsTemplateKeyToContext<T> =
  T extends 'InviteExistingUserToSite.hbs'
    ? InvitedExistingUserToSiteContext
    : T extends 'InviteNewUserToSite.hbs'
    ? InviteNewUserToSiteContext
    : never;

export function getEmailTemplate<T extends HandlebarsTemplateKey>(
  templateKey: T,
): HandlebarsTemplateDelegate<HandlebarsTemplateKeyToContext<T>> {
  return Handlebars.templates[templateKey] as HandlebarsTemplateDelegate<
    HandlebarsTemplateKeyToContext<T>
  >;
}
