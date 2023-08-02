var Handlebars = require('handlebars/runtime');
var template = Handlebars.template,
  templates = (Handlebars.templates = Handlebars.templates || {});
templates['InviteNewUserToSite.hbs'] = template({
  compiler: [8, '>= 4.3.0'],
  main: function (container, depth0, helpers, partials, data) {
    var stack1,
      helper,
      alias1 = depth0 != null ? depth0 : container.nullContext || {},
      alias2 = container.hooks.helperMissing,
      alias3 = 'function',
      alias4 = container.escapeExpression,
      lookupProperty =
        container.lookupProperty ||
        function (parent, propertyName) {
          if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
            return parent[propertyName];
          }
          return undefined;
        };

    return (
      '<html>\n  <body>\n    <p>Hello ' +
      alias4(
        ((helper =
          (helper =
            lookupProperty(helpers, 'email') ||
            (depth0 != null ? lookupProperty(depth0, 'email') : depth0)) != null
            ? helper
            : alias2),
        typeof helper === alias3
          ? helper.call(alias1, {
              name: 'email',
              hash: {},
              data: data,
              loc: {
                start: { line: 3, column: 13 },
                end: { line: 3, column: 22 },
              },
            })
          : helper),
      ) +
      '</p>\n    <p>\n      ' +
      alias4(
        ((helper =
          (helper =
            lookupProperty(helpers, 'siteTitle') ||
            (depth0 != null ? lookupProperty(depth0, 'siteTitle') : depth0)) !=
          null
            ? helper
            : alias2),
        typeof helper === alias3
          ? helper.call(alias1, {
              name: 'siteTitle',
              hash: {},
              data: data,
              loc: {
                start: { line: 5, column: 6 },
                end: { line: 5, column: 19 },
              },
            })
          : helper),
      ) +
      '\n      has given you access to their Mediavine dashboard. We created you an\n      account under this email address:\n      ' +
      alias4(
        ((helper =
          (helper =
            lookupProperty(helpers, 'email') ||
            (depth0 != null ? lookupProperty(depth0, 'email') : depth0)) != null
            ? helper
            : alias2),
        typeof helper === alias3
          ? helper.call(alias1, {
              name: 'email',
              hash: {},
              data: data,
              loc: {
                start: { line: 8, column: 6 },
                end: { line: 8, column: 15 },
              },
            })
          : helper),
      ) +
      "\n    </p>\n    <p>Since we auto created your account, you'll have to accept the invitation\n      by resetting your password in order to first log in.</p>\n    <p><a href='" +
      ((stack1 =
        ((helper =
          (helper =
            lookupProperty(helpers, 'invitationUrl') ||
            (depth0 != null
              ? lookupProperty(depth0, 'invitationUrl')
              : depth0)) != null
            ? helper
            : alias2),
        typeof helper === alias3
          ? helper.call(alias1, {
              name: 'invitationUrl',
              hash: {},
              data: data,
              loc: {
                start: { line: 12, column: 16 },
                end: { line: 12, column: 35 },
              },
            })
          : helper)) != null
        ? stack1
        : '') +
      "' target='_blank'>Reset your password here.</a></p>\n  </body>\n</html>"
    );
  },
  useData: true,
});
