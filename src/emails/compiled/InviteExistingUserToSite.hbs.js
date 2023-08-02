var Handlebars = require('handlebars/runtime');
var template = Handlebars.template,
  templates = (Handlebars.templates = Handlebars.templates || {});
templates['InviteExistingUserToSite.hbs'] = template({
  compiler: [8, '>= 4.3.0'],
  main: function (container, depth0, helpers, partials, data) {
    var helper,
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
      '<html>\n  <body>\n    <p>' +
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
                start: { line: 3, column: 7 },
                end: { line: 3, column: 20 },
              },
            })
          : helper),
      ) +
      '\n      has given you access to their Mediavine dashboard. You can view it using\n      your existing account under this email address (' +
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
                start: { line: 5, column: 54 },
                end: { line: 5, column: 63 },
              },
            })
          : helper),
      ) +
      ") by going to:\n      <a href='" +
      alias4(
        ((helper =
          (helper =
            lookupProperty(helpers, 'appRootUrl') ||
            (depth0 != null ? lookupProperty(depth0, 'appRootUrl') : depth0)) !=
          null
            ? helper
            : alias2),
        typeof helper === alias3
          ? helper.call(alias1, {
              name: 'appRootUrl',
              hash: {},
              data: data,
              loc: {
                start: { line: 6, column: 15 },
                end: { line: 6, column: 29 },
              },
            })
          : helper),
      ) +
      "'>" +
      alias4(
        ((helper =
          (helper =
            lookupProperty(helpers, 'appRootUrl') ||
            (depth0 != null ? lookupProperty(depth0, 'appRootUrl') : depth0)) !=
          null
            ? helper
            : alias2),
        typeof helper === alias3
          ? helper.call(alias1, {
              name: 'appRootUrl',
              hash: {},
              data: data,
              loc: {
                start: { line: 6, column: 31 },
                end: { line: 6, column: 45 },
              },
            })
          : helper),
      ) +
      '</a>\n    </p>\n  </body>\n</html>'
    );
  },
  useData: true,
});
