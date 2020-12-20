
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function (constants) {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var page = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
    	 module.exports = factory() ;
    }(commonjsGlobal, (function () {
    var isarray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
      // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
      // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
      '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {String} str
     * @return {Array}
     */
    function parse (str) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var res;

      while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          continue
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
        }

        var prefix = res[2];
        var name = res[3];
        var capture = res[4];
        var group = res[5];
        var suffix = res[6];
        var asterisk = res[7];

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';
        var delimiter = prefix || '/';
        var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

        tokens.push({
          name: name || key++,
          prefix: prefix || '',
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: escapeGroup(pattern)
        });
      }

      // Match any characters still remaining.
      if (index < str.length) {
        path += str.substr(index);
      }

      // If the path exists, push it onto the end.
      if (path) {
        tokens.push(path);
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {String}   str
     * @return {Function}
     */
    function compile (str) {
      return tokensToFunction(parse(str))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^' + tokens[i].pattern + '$');
        }
      }

      return function (obj) {
        var path = '';
        var data = obj || {};

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;

            continue
          }

          var value = data[token.name];
          var segment;

          if (value == null) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to be defined')
            }
          }

          if (isarray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
            }

            if (value.length === 0) {
              if (token.optional) {
                continue
              } else {
                throw new TypeError('Expected "' + token.name + '" to not be empty')
              }
            }

            for (var j = 0; j < value.length; j++) {
              segment = encodeURIComponent(value[j]);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          segment = encodeURIComponent(value);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += token.prefix + segment;
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {String} str
     * @return {String}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys (re, keys) {
      re.keys = keys;
      return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags (options) {
      return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp (path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

      return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function stringToRegexp (path, keys, options) {
      var tokens = parse(path);
      var re = tokensToRegExp(tokens, options);

      // Attach keys back to the regexp.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys.push(tokens[i]);
        }
      }

      return attachKeys(re, keys)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {Array}  tokens
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function tokensToRegExp (tokens, options) {
      options = options || {};

      var strict = options.strict;
      var end = options.end !== false;
      var route = '';
      var lastToken = tokens[tokens.length - 1];
      var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var prefix = escapeString(token.prefix);
          var capture = token.pattern;

          if (token.repeat) {
            capture += '(?:' + prefix + capture + ')*';
          }

          if (token.optional) {
            if (prefix) {
              capture = '(?:' + prefix + '(' + capture + '))?';
            } else {
              capture = '(' + capture + ')?';
            }
          } else {
            capture = prefix + '(' + capture + ')';
          }

          route += capture;
        }
      }

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return new RegExp('^' + route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(String|RegExp|Array)} path
     * @param  {Array}                 [keys]
     * @param  {Object}                [options]
     * @return {RegExp}
     */
    function pathToRegexp (path, keys, options) {
      keys = keys || [];

      if (!isarray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (isarray(path)) {
        return arrayToRegexp(path, keys, options)
      }

      return stringToRegexp(path, keys, options)
    }

    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

    /**
       * Module dependencies.
       */

      

      /**
       * Short-cuts for global-object checks
       */

      var hasDocument = ('undefined' !== typeof document);
      var hasWindow = ('undefined' !== typeof window);
      var hasHistory = ('undefined' !== typeof history);
      var hasProcess = typeof process !== 'undefined';

      /**
       * Detect click event
       */
      var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var isLocation = hasWindow && !!(window.history.location || window.location);

      /**
       * The page instance
       * @api private
       */
      function Page() {
        // public things
        this.callbacks = [];
        this.exits = [];
        this.current = '';
        this.len = 0;

        // private things
        this._decodeURLComponents = true;
        this._base = '';
        this._strict = false;
        this._running = false;
        this._hashbang = false;

        // bound functions
        this.clickHandler = this.clickHandler.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
      }

      /**
       * Configure the instance of page. This can be called multiple times.
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.configure = function(options) {
        var opts = options || {};

        this._window = opts.window || (hasWindow && window);
        this._decodeURLComponents = opts.decodeURLComponents !== false;
        this._popstate = opts.popstate !== false && hasWindow;
        this._click = opts.click !== false && hasDocument;
        this._hashbang = !!opts.hashbang;

        var _window = this._window;
        if(this._popstate) {
          _window.addEventListener('popstate', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('popstate', this._onpopstate, false);
        }

        if (this._click) {
          _window.document.addEventListener(clickEvent, this.clickHandler, false);
        } else if(hasDocument) {
          _window.document.removeEventListener(clickEvent, this.clickHandler, false);
        }

        if(this._hashbang && hasWindow && !hasHistory) {
          _window.addEventListener('hashchange', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('hashchange', this._onpopstate, false);
        }
      };

      /**
       * Get or set basepath to `path`.
       *
       * @param {string} path
       * @api public
       */

      Page.prototype.base = function(path) {
        if (0 === arguments.length) return this._base;
        this._base = path;
      };

      /**
       * Gets the `base`, which depends on whether we are using History or
       * hashbang routing.

       * @api private
       */
      Page.prototype._getBase = function() {
        var base = this._base;
        if(!!base) return base;
        var loc = hasWindow && this._window && this._window.location;

        if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
          base = loc.pathname;
        }

        return base;
      };

      /**
       * Get or set strict path matching to `enable`
       *
       * @param {boolean} enable
       * @api public
       */

      Page.prototype.strict = function(enable) {
        if (0 === arguments.length) return this._strict;
        this._strict = enable;
      };


      /**
       * Bind with the given `options`.
       *
       * Options:
       *
       *    - `click` bind to click events [true]
       *    - `popstate` bind to popstate [true]
       *    - `dispatch` perform initial dispatch [true]
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.start = function(options) {
        var opts = options || {};
        this.configure(opts);

        if (false === opts.dispatch) return;
        this._running = true;

        var url;
        if(isLocation) {
          var window = this._window;
          var loc = window.location;

          if(this._hashbang && ~loc.hash.indexOf('#!')) {
            url = loc.hash.substr(2) + loc.search;
          } else if (this._hashbang) {
            url = loc.search + loc.hash;
          } else {
            url = loc.pathname + loc.search + loc.hash;
          }
        }

        this.replace(url, null, true, opts.dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      Page.prototype.stop = function() {
        if (!this._running) return;
        this.current = '';
        this.len = 0;
        this._running = false;

        var window = this._window;
        this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
        hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
        hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
      };

      /**
       * Show `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} dispatch
       * @param {boolean=} push
       * @return {!Context}
       * @api public
       */

      Page.prototype.show = function(path, state, dispatch, push) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        if (false !== dispatch) this.dispatch(ctx, prev);
        if (false !== ctx.handled && false !== push) ctx.pushState();
        return ctx;
      };

      /**
       * Goes back in the history
       * Back should always let the current route push state and then go back.
       *
       * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
       * @param {Object=} state
       * @api public
       */

      Page.prototype.back = function(path, state) {
        var page = this;
        if (this.len > 0) {
          var window = this._window;
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          hasHistory && window.history.back();
          this.len--;
        } else if (path) {
          setTimeout(function() {
            page.show(path, state);
          });
        } else {
          setTimeout(function() {
            page.show(page._getBase(), state);
          });
        }
      };

      /**
       * Register route to redirect from one path to other
       * or just redirect to another route
       *
       * @param {string} from - if param 'to' is undefined redirects to 'from'
       * @param {string=} to
       * @api public
       */
      Page.prototype.redirect = function(from, to) {
        var inst = this;

        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page.call(this, from, function(e) {
            setTimeout(function() {
              inst.replace(/** @type {!string} */ (to));
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function() {
            inst.replace(from);
          }, 0);
        }
      };

      /**
       * Replace `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} init
       * @param {boolean=} dispatch
       * @return {!Context}
       * @api public
       */


      Page.prototype.replace = function(path, state, init, dispatch) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        ctx.init = init;
        ctx.save(); // save before dispatching, which may redirect
        if (false !== dispatch) this.dispatch(ctx, prev);
        return ctx;
      };

      /**
       * Dispatch the given `ctx`.
       *
       * @param {Context} ctx
       * @api private
       */

      Page.prototype.dispatch = function(ctx, prev) {
        var i = 0, j = 0, page = this;

        function nextExit() {
          var fn = page.exits[j++];
          if (!fn) return nextEnter();
          fn(prev, nextExit);
        }

        function nextEnter() {
          var fn = page.callbacks[i++];

          if (ctx.path !== page.current) {
            ctx.handled = false;
            return;
          }
          if (!fn) return unhandled.call(page, ctx);
          fn(ctx, nextEnter);
        }

        if (prev) {
          nextExit();
        } else {
          nextEnter();
        }
      };

      /**
       * Register an exit route on `path` with
       * callback `fn()`, which will be called
       * on the previous context when a new
       * page is visited.
       */
      Page.prototype.exit = function(path, fn) {
        if (typeof path === 'function') {
          return this.exit('*', path);
        }

        var route = new Route(path, null, this);
        for (var i = 1; i < arguments.length; ++i) {
          this.exits.push(route.middleware(arguments[i]));
        }
      };

      /**
       * Handle "click" events.
       */

      /* jshint +W054 */
      Page.prototype.clickHandler = function(e) {
        if (1 !== this._which(e)) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return;

        // ensure link
        // use shadow dom when available if not, fall back to composedPath()
        // for browsers that only have shady
        var el = e.target;
        var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

        if(eventPath) {
          for (var i = 0; i < eventPath.length; i++) {
            if (!eventPath[i].nodeName) continue;
            if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
            if (!eventPath[i].href) continue;

            el = eventPath[i];
            break;
          }
        }

        // continue ensure link
        // el.nodeName for svg links are 'a' instead of 'A'
        while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
        if (!el || 'A' !== el.nodeName.toUpperCase()) return;

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

        // ensure non-hash for the same path
        var link = el.getAttribute('href');
        if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

        // Check for mailto: in the href
        if (link && link.indexOf('mailto:') > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !this.sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

        path = path[0] !== '/' ? '/' + path : path;

        // strip leading "/[drive letter]:" on NW.js on Windows
        if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
          path = path.replace(/^\/[a-zA-Z]:\//, '/');
        }

        // same page
        var orig = path;
        var pageBase = this._getBase();

        if (path.indexOf(pageBase) === 0) {
          path = path.substr(pageBase.length);
        }

        if (this._hashbang) path = path.replace('#!', '');

        if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
          return;
        }

        e.preventDefault();
        this.show(orig);
      };

      /**
       * Handle "populate" events.
       * @api private
       */

      Page.prototype._onpopstate = (function () {
        var loaded = false;
        if ( ! hasWindow ) {
          return function () {};
        }
        if (hasDocument && document.readyState === 'complete') {
          loaded = true;
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              loaded = true;
            }, 0);
          });
        }
        return function onpopstate(e) {
          if (!loaded) return;
          var page = this;
          if (e.state) {
            var path = e.state.path;
            page.replace(path, e.state);
          } else if (isLocation) {
            var loc = page._window.location;
            page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
          }
        };
      })();

      /**
       * Event button.
       */
      Page.prototype._which = function(e) {
        e = e || (hasWindow && this._window.event);
        return null == e.which ? e.button : e.which;
      };

      /**
       * Convert to a URL object
       * @api private
       */
      Page.prototype._toURL = function(href) {
        var window = this._window;
        if(typeof URL === 'function' && isLocation) {
          return new URL(href, window.location.toString());
        } else if (hasDocument) {
          var anc = window.document.createElement('a');
          anc.href = href;
          return anc;
        }
      };

      /**
       * Check if `href` is the same origin.
       * @param {string} href
       * @api public
       */
      Page.prototype.sameOrigin = function(href) {
        if(!href || !isLocation) return false;

        var url = this._toURL(href);
        var window = this._window;

        var loc = window.location;

        /*
           When the port is the default http port 80 for http, or 443 for
           https, internet explorer 11 returns an empty string for loc.port,
           so we need to compare loc.port with an empty string if url.port
           is the default port 80 or 443.
           Also the comparition with `port` is changed from `===` to `==` because
           `port` can be a string sometimes. This only applies to ie11.
        */
        return loc.protocol === url.protocol &&
          loc.hostname === url.hostname &&
          (loc.port === url.port || loc.port === '' && (url.port == 80 || url.port == 443)); // jshint ignore:line
      };

      /**
       * @api private
       */
      Page.prototype._samePath = function(url) {
        if(!isLocation) return false;
        var window = this._window;
        var loc = window.location;
        return url.pathname === loc.pathname &&
          url.search === loc.search;
      };

      /**
       * Remove URL encoding from the given `str`.
       * Accommodates whitespace in both x-www-form-urlencoded
       * and regular percent-encoded form.
       *
       * @param {string} val - URL component to decode
       * @api private
       */
      Page.prototype._decodeURLEncodedURIComponent = function(val) {
        if (typeof val !== 'string') { return val; }
        return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
      };

      /**
       * Create a new `page` instance and function
       */
      function createPage() {
        var pageInstance = new Page();

        function pageFn(/* args */) {
          return page.apply(pageInstance, arguments);
        }

        // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
        pageFn.callbacks = pageInstance.callbacks;
        pageFn.exits = pageInstance.exits;
        pageFn.base = pageInstance.base.bind(pageInstance);
        pageFn.strict = pageInstance.strict.bind(pageInstance);
        pageFn.start = pageInstance.start.bind(pageInstance);
        pageFn.stop = pageInstance.stop.bind(pageInstance);
        pageFn.show = pageInstance.show.bind(pageInstance);
        pageFn.back = pageInstance.back.bind(pageInstance);
        pageFn.redirect = pageInstance.redirect.bind(pageInstance);
        pageFn.replace = pageInstance.replace.bind(pageInstance);
        pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
        pageFn.exit = pageInstance.exit.bind(pageInstance);
        pageFn.configure = pageInstance.configure.bind(pageInstance);
        pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
        pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

        pageFn.create = createPage;

        Object.defineProperty(pageFn, 'len', {
          get: function(){
            return pageInstance.len;
          },
          set: function(val) {
            pageInstance.len = val;
          }
        });

        Object.defineProperty(pageFn, 'current', {
          get: function(){
            return pageInstance.current;
          },
          set: function(val) {
            pageInstance.current = val;
          }
        });

        // In 2.0 these can be named exports
        pageFn.Context = Context;
        pageFn.Route = Route;

        return pageFn;
      }

      /**
       * Register `path` with callback `fn()`,
       * or route `path`, or redirection,
       * or `page.start()`.
       *
       *   page(fn);
       *   page('*', fn);
       *   page('/user/:id', load, user);
       *   page('/user/' + user.id, { some: 'thing' });
       *   page('/user/' + user.id);
       *   page('/from', '/to')
       *   page();
       *
       * @param {string|!Function|!Object} path
       * @param {Function=} fn
       * @api public
       */

      function page(path, fn) {
        // <callback>
        if ('function' === typeof path) {
          return page.call(this, '*', path);
        }

        // route <path> to <callback ...>
        if ('function' === typeof fn) {
          var route = new Route(/** @type {string} */ (path), null, this);
          for (var i = 1; i < arguments.length; ++i) {
            this.callbacks.push(route.middleware(arguments[i]));
          }
          // show <path> with [state]
        } else if ('string' === typeof path) {
          this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
          // start [options]
        } else {
          this.start(path);
        }
      }

      /**
       * Unhandled `ctx`. When it's not the initial
       * popstate then redirect. If you wish to handle
       * 404s on your own use `page('*', callback)`.
       *
       * @param {Context} ctx
       * @api private
       */
      function unhandled(ctx) {
        if (ctx.handled) return;
        var current;
        var page = this;
        var window = page._window;

        if (page._hashbang) {
          current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
        } else {
          current = isLocation && window.location.pathname + window.location.search;
        }

        if (current === ctx.canonicalPath) return;
        page.stop();
        ctx.handled = false;
        isLocation && (window.location.href = ctx.canonicalPath);
      }

      /**
       * Escapes RegExp characters in the given string.
       *
       * @param {string} s
       * @api private
       */
      function escapeRegExp(s) {
        return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      }

      /**
       * Initialize a new "request" `Context`
       * with the given `path` and optional initial `state`.
       *
       * @constructor
       * @param {string} path
       * @param {Object=} state
       * @api public
       */

      function Context(path, state, pageInstance) {
        var _page = this.page = pageInstance || page;
        var window = _page._window;
        var hashbang = _page._hashbang;

        var pageBase = _page._getBase();
        if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
        var i = path.indexOf('?');

        this.canonicalPath = path;
        var re = new RegExp('^' + escapeRegExp(pageBase));
        this.path = path.replace(re, '') || '/';
        if (hashbang) this.path = this.path.replace('#!', '') || '/';

        this.title = (hasDocument && window.document.title);
        this.state = state || {};
        this.state.path = path;
        this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
        this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
        this.params = {};

        // fragment
        this.hash = '';
        if (!hashbang) {
          if (!~this.path.indexOf('#')) return;
          var parts = this.path.split('#');
          this.path = this.pathname = parts[0];
          this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
          this.querystring = this.querystring.split('#')[0];
        }
      }

      /**
       * Push state.
       *
       * @api private
       */

      Context.prototype.pushState = function() {
        var page = this.page;
        var window = page._window;
        var hashbang = page._hashbang;

        page.len++;
        if (hasHistory) {
            window.history.pushState(this.state, this.title,
              hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function() {
        var page = this.page;
        if (hasHistory) {
            page._window.history.replaceState(this.state, this.title,
              page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Initialize `Route` with the given HTTP `path`,
       * and an array of `callbacks` and `options`.
       *
       * Options:
       *
       *   - `sensitive`    enable case-sensitive routes
       *   - `strict`       enable strict matching for trailing slashes
       *
       * @constructor
       * @param {string} path
       * @param {Object=} options
       * @api private
       */

      function Route(path, options, page) {
        var _page = this.page = page || globalPage;
        var opts = options || {};
        opts.strict = opts.strict || _page._strict;
        this.path = (path === '*') ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
      }

      /**
       * Return route middleware with
       * the given callback `fn()`.
       *
       * @param {Function} fn
       * @return {Function}
       * @api public
       */

      Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
          if (self.match(ctx.path, ctx.params)) {
            ctx.routePath = self.path;
            return fn(ctx, next);
          }
          next();
        };
      };

      /**
       * Check if this route matches `path`, if so
       * populate `params`.
       *
       * @param {string} path
       * @param {Object} params
       * @return {boolean}
       * @api private
       */

      Route.prototype.match = function(path, params) {
        var keys = this.keys,
          qsIndex = path.indexOf('?'),
          pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
          m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;

        delete params[0];

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = this.page._decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
            params[key.name] = val;
          }
        }

        return true;
      };


      /**
       * Module exports.
       */

      var globalPage = createPage();
      var page_js = globalPage;
      var default_1 = globalPage;

    page_js.default = default_1;

    return page_js;

    })));
    });

    /* src/globalSite/NavBar.svelte generated by Svelte v3.31.0 */

    const file = "src/globalSite/NavBar.svelte";

    function create_fragment(ctx) {
    	let main;
    	let nav;
    	let a0;
    	let t1;
    	let button;
    	let span;
    	let t2;
    	let div2;
    	let ul;
    	let li0;
    	let a1;
    	let t3;
    	let a1_class_value;
    	let t4;
    	let li1;
    	let a2;
    	let t5;
    	let a2_class_value;
    	let t6;
    	let li2;
    	let a3;
    	let t8;
    	let div1;
    	let a4;
    	let t10;
    	let a5;
    	let t12;
    	let div0;
    	let t13;
    	let a6;

    	const block = {
    		c: function create() {
    			main = element("main");
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "ask.cr";
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			t2 = space();
    			div2 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			t3 = text("Questions");
    			t4 = space();
    			li1 = element("li");
    			a2 = element("a");
    			t5 = text("Profile");
    			t6 = space();
    			li2 = element("li");
    			a3 = element("a");
    			a3.textContent = "Actions";
    			t8 = space();
    			div1 = element("div");
    			a4 = element("a");
    			a4.textContent = "Ask a question";
    			t10 = space();
    			a5 = element("a");
    			a5.textContent = "See answered questions";
    			t12 = space();
    			div0 = element("div");
    			t13 = space();
    			a6 = element("a");
    			a6.textContent = "Contact us!";
    			attr_dev(a0, "class", "navbar-brand");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file, 6, 8, 126);
    			attr_dev(span, "class", "navbar-toggler-icon");
    			add_location(span, file, 9, 12, 401);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-toggle", "collapse");
    			attr_dev(button, "data-target", "#navbarSupportedContent");
    			attr_dev(button, "aria-controls", "navbarSupportedContent");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file, 7, 8, 178);
    			attr_dev(a1, "class", a1_class_value = "nav-link " + (/*current*/ ctx[0] === "Questions" ? "active" : ""));
    			attr_dev(a1, "href", "/questions");
    			add_location(a1, file, 15, 20, 639);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file, 14, 16, 597);
    			attr_dev(a2, "class", a2_class_value = "nav-link " + (/*current*/ ctx[0] === "Profile" ? "active" : ""));
    			attr_dev(a2, "href", "/profile");
    			add_location(a2, file, 18, 20, 813);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file, 17, 16, 771);
    			attr_dev(a3, "class", "nav-link dropdown-toggle");
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "id", "navbarDropdown");
    			attr_dev(a3, "role", "button");
    			attr_dev(a3, "data-toggle", "dropdown");
    			attr_dev(a3, "aria-haspopup", "true");
    			attr_dev(a3, "aria-expanded", "false");
    			add_location(a3, file, 21, 20, 990);
    			attr_dev(a4, "class", "dropdown-item svelte-1xpgeke");
    			attr_dev(a4, "href", "#");
    			add_location(a4, file, 26, 24, 1322);
    			attr_dev(a5, "class", "dropdown-item svelte-1xpgeke");
    			attr_dev(a5, "href", "#");
    			add_location(a5, file, 27, 24, 1399);
    			attr_dev(div0, "class", "dropdown-divider");
    			add_location(div0, file, 28, 24, 1484);
    			attr_dev(a6, "class", "dropdown-item svelte-1xpgeke");
    			attr_dev(a6, "href", "#");
    			add_location(a6, file, 29, 24, 1545);
    			attr_dev(div1, "class", "dropdown-menu svelte-1xpgeke");
    			attr_dev(div1, "aria-labelledby", "navbarDropdown");
    			add_location(div1, file, 25, 20, 1237);
    			attr_dev(li2, "class", "nav-item dropdown");
    			add_location(li2, file, 20, 16, 939);
    			attr_dev(ul, "class", "navbar-nav mr-auto");
    			add_location(ul, file, 13, 12, 549);
    			attr_dev(div2, "class", "collapse navbar-collapse");
    			attr_dev(div2, "id", "navbarSupportedContent");
    			add_location(div2, file, 12, 8, 470);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-light bg-dark svelte-1xpgeke");
    			add_location(nav, file, 5, 4, 59);
    			add_location(main, file, 4, 0, 48);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, nav);
    			append_dev(nav, a0);
    			append_dev(nav, t1);
    			append_dev(nav, button);
    			append_dev(button, span);
    			append_dev(nav, t2);
    			append_dev(nav, div2);
    			append_dev(div2, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(a1, t3);
    			append_dev(ul, t4);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(a2, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li2);
    			append_dev(li2, a3);
    			append_dev(li2, t8);
    			append_dev(li2, div1);
    			append_dev(div1, a4);
    			append_dev(div1, t10);
    			append_dev(div1, a5);
    			append_dev(div1, t12);
    			append_dev(div1, div0);
    			append_dev(div1, t13);
    			append_dev(div1, a6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*current*/ 1 && a1_class_value !== (a1_class_value = "nav-link " + (/*current*/ ctx[0] === "Questions" ? "active" : ""))) {
    				attr_dev(a1, "class", a1_class_value);
    			}

    			if (dirty & /*current*/ 1 && a2_class_value !== (a2_class_value = "nav-link " + (/*current*/ ctx[0] === "Profile" ? "active" : ""))) {
    				attr_dev(a2, "class", a2_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NavBar", slots, []);
    	let { current = "" } = $$props;
    	const writable_props = ["current"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("current" in $$props) $$invalidate(0, current = $$props.current);
    	};

    	$$self.$capture_state = () => ({ current });

    	$$self.$inject_state = $$props => {
    		if ("current" in $$props) $$invalidate(0, current = $$props.current);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [current];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { current: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get current() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set current(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Home.svelte generated by Svelte v3.31.0 */
    const file$1 = "src/Home.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let navbar;
    	let t0;
    	let div0;
    	let p;
    	let t2;
    	let div1;
    	let h2;
    	let current;

    	navbar = new NavBar({
    			props: { current: "none" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "ask.cr";
    			t2 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "BY DEVELOPERS, FOR DEVELOPERS";
    			attr_dev(p, "class", "svelte-wdlftc");
    			add_location(p, file$1, 8, 40, 187);
    			attr_dev(div0, "id", "parrallax");
    			attr_dev(div0, "class", "content svelte-wdlftc");
    			add_location(div0, file$1, 8, 4, 151);
    			attr_dev(h2, "class", "svelte-wdlftc");
    			add_location(h2, file$1, 9, 31, 238);
    			attr_dev(div1, "class", "content-light svelte-wdlftc");
    			add_location(div1, file$1, 9, 4, 211);
    			attr_dev(main, "class", "svelte-wdlftc");
    			add_location(main, file$1, 5, 0, 109);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t0);
    			append_dev(main, div0);
    			append_dev(div0, p);
    			append_dev(main, t2);
    			append_dev(main, div1);
    			append_dev(div1, h2);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ SIGTERM: constants.SIGTERM, NavBar });
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/globalSite/SideBar.svelte generated by Svelte v3.31.0 */

    const file$2 = "src/globalSite/SideBar.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div3;
    	let h50;
    	let t1;
    	let div0;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let h51;
    	let t7;
    	let div1;
    	let p2;
    	let t9;
    	let p3;
    	let t11;
    	let h52;
    	let t13;
    	let div2;
    	let p4;
    	let t15;
    	let p5;
    	let t17;
    	let p6;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div3 = element("div");
    			h50 = element("h5");
    			h50.textContent = "The Crystal Blog";
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Content";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "More Content";
    			t5 = space();
    			h51 = element("h5");
    			h51.textContent = "Featured";
    			t7 = space();
    			div1 = element("div");
    			p2 = element("p");
    			p2.textContent = "Content";
    			t9 = space();
    			p3 = element("p");
    			p3.textContent = "More Content";
    			t11 = space();
    			h52 = element("h5");
    			h52.textContent = "Popular Posts";
    			t13 = space();
    			div2 = element("div");
    			p4 = element("p");
    			p4.textContent = "Why is Crystal so cool?";
    			t15 = space();
    			p5 = element("p");
    			p5.textContent = "XMas is almost here!";
    			t17 = space();
    			p6 = element("p");
    			p6.textContent = "These are mostly off-topic";
    			attr_dev(h50, "class", "svelte-1qjpkmx");
    			add_location(h50, file$2, 7, 8, 158);
    			attr_dev(p0, "class", "svelte-1qjpkmx");
    			add_location(p0, file$2, 9, 12, 210);
    			attr_dev(p1, "class", "svelte-1qjpkmx");
    			add_location(p1, file$2, 10, 12, 237);
    			add_location(div0, file$2, 8, 8, 192);
    			attr_dev(h51, "class", "svelte-1qjpkmx");
    			add_location(h51, file$2, 14, 8, 352);
    			attr_dev(p2, "class", "svelte-1qjpkmx");
    			add_location(p2, file$2, 16, 12, 396);
    			attr_dev(p3, "class", "svelte-1qjpkmx");
    			add_location(p3, file$2, 17, 12, 423);
    			add_location(div1, file$2, 15, 8, 378);
    			attr_dev(h52, "class", "svelte-1qjpkmx");
    			add_location(h52, file$2, 21, 8, 523);
    			attr_dev(p4, "class", "svelte-1qjpkmx");
    			add_location(p4, file$2, 23, 12, 572);
    			attr_dev(p5, "class", "svelte-1qjpkmx");
    			add_location(p5, file$2, 24, 12, 615);
    			attr_dev(p6, "class", "svelte-1qjpkmx");
    			add_location(p6, file$2, 25, 12, 655);
    			add_location(div2, file$2, 22, 8, 554);
    			attr_dev(div3, "class", "sidebar a-child-afloat svelte-1qjpkmx");
    			add_location(div3, file$2, 5, 4, 32);
    			add_location(main, file$2, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, h50);
    			append_dev(div3, t1);
    			append_dev(div3, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, p1);
    			append_dev(div3, t5);
    			append_dev(div3, h51);
    			append_dev(div3, t7);
    			append_dev(div3, div1);
    			append_dev(div1, p2);
    			append_dev(div1, t9);
    			append_dev(div1, p3);
    			append_dev(div3, t11);
    			append_dev(div3, h52);
    			append_dev(div3, t13);
    			append_dev(div3, div2);
    			append_dev(div2, p4);
    			append_dev(div2, t15);
    			append_dev(div2, p5);
    			append_dev(div2, t17);
    			append_dev(div2, p6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SideBar", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SideBar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class SideBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SideBar",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/questions/Questions.svelte generated by Svelte v3.31.0 */
    const file$3 = "src/questions/Questions.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (35:20) {#each question.tags as tag}
    function create_each_block_1(ctx) {
    	let span;
    	let t_value = /*tag*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "tag svelte-w482ky");
    			add_location(span, file$3, 35, 24, 1598);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(35:20) {#each question.tags as tag}",
    		ctx
    	});

    	return block;
    }

    // (27:12) {#each questions as question}
    function create_each_block(ctx) {
    	let hr;
    	let t0;
    	let div1;
    	let div0;
    	let h4;
    	let a;
    	let t1_value = /*question*/ ctx[1].title + "";
    	let t1;
    	let t2;
    	let t3;
    	let br0;
    	let t4;
    	let br1;
    	let t5;
    	let each_value_1 = /*question*/ ctx[1].tags;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			a = element("a");
    			t1 = text(t1_value);
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			br0 = element("br");
    			t4 = space();
    			br1 = element("br");
    			t5 = space();
    			attr_dev(hr, "class", "svelte-w482ky");
    			add_location(hr, file$3, 27, 16, 1311);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-w482ky");
    			add_location(a, file$3, 31, 28, 1435);
    			add_location(h4, file$3, 30, 24, 1402);
    			attr_dev(div0, "class", "title");
    			add_location(div0, file$3, 29, 20, 1358);
    			add_location(br0, file$3, 38, 20, 1686);
    			add_location(br1, file$3, 39, 20, 1711);
    			add_location(div1, file$3, 28, 16, 1332);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h4);
    			append_dev(h4, a);
    			append_dev(a, t1);
    			append_dev(div1, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t3);
    			append_dev(div1, br0);
    			append_dev(div1, t4);
    			append_dev(div1, br1);
    			append_dev(div1, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*questions*/ 1) {
    				each_value_1 = /*question*/ ctx[1].tags;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t3);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:12) {#each questions as question}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let navbar;
    	let t0;
    	let h3;
    	let t2;
    	let div2;
    	let div0;
    	let t3;
    	let div1;
    	let t4;
    	let sidebar;
    	let current;

    	navbar = new NavBar({
    			props: { current: "Questions" },
    			$$inline: true
    		});

    	let each_value = /*questions*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	sidebar = new SideBar({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			h3 = element("h3");
    			h3.textContent = "Questions";
    			t2 = space();
    			div2 = element("div");
    			div0 = element("div");
    			t3 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			create_component(sidebar.$$.fragment);
    			attr_dev(h3, "class", "questions-title svelte-w482ky");
    			add_location(h3, file$3, 17, 4, 1044);
    			attr_dev(div0, "class", "the-great-all-knowing-container svelte-w482ky");
    			add_location(div0, file$3, 22, 8, 1144);
    			attr_dev(div1, "class", "questions a-child-afloat svelte-w482ky");
    			add_location(div1, file$3, 25, 8, 1214);
    			attr_dev(div2, "class", "float-container svelte-w482ky");
    			add_location(div2, file$3, 21, 4, 1106);
    			attr_dev(main, "class", "svelte-w482ky");
    			add_location(main, file$3, 13, 0, 996);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t0);
    			append_dev(main, h3);
    			append_dev(main, t2);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t3);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div2, t4);
    			mount_component(sidebar, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*questions*/ 1) {
    				each_value = /*questions*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(sidebar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(sidebar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_each(each_blocks, detaching);
    			destroy_component(sidebar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Questions", slots, []);

    	let questions = [
    		{
    			title: "Why isn't it working?",
    			tags: ["tags", "just why", "no context!!!"],
    			content: "I'm sorry I can't give you code, but it isn't working! HELP!!!"
    		},
    		{
    			title: "Well this is embarrasing...",
    			tags: ["this is a tag!", "they be cool", "just like me"],
    			content: "Yeah, I was too lazy to add different content XD"
    		},
    		{
    			title: "Why isn't it working?",
    			tags: ["I was too", "lazy to", "change the titles"],
    			content: "I'm sorry I can't give you code, but it isn't working! HELP!!!"
    		},
    		{
    			title: "Why isn't it working?",
    			tags: ["tags", "just why", "no context!!!"],
    			content: "I'm sorry I can't give you code, but it isn't working! HELP!!!"
    		},
    		{
    			title: "Why isn't it working?",
    			tags: ["tags", "just why", "no context!!!"],
    			content: "I'm sorry I can't give you code, but it isn't working! HELP!!!"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Questions> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ NavBar, SideBar, questions });

    	$$self.$inject_state = $$props => {
    		if ("questions" in $$props) $$invalidate(0, questions = $$props.questions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [questions];
    }

    class Questions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Questions",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/profiles/PersonalProfile.svelte generated by Svelte v3.31.0 */
    const file$4 = "src/profiles/PersonalProfile.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let navbar;
    	let t0;
    	let div3;
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t1;
    	let div0;
    	let h1;
    	let t2_value = /*params*/ ctx[0].name + "";
    	let t2;
    	let t3;
    	let h3;
    	let t4_value = /*params*/ ctx[0].title + "";
    	let t4;
    	let t5;
    	let p;
    	let t6_value = /*params*/ ctx[0].bio + "";
    	let t6;
    	let t7;
    	let small;
    	let current;

    	navbar = new NavBar({
    			props: { current: "Profile" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t1 = space();
    			div0 = element("div");
    			h1 = element("h1");
    			t2 = text(t2_value);
    			t3 = space();
    			h3 = element("h3");
    			t4 = text(t4_value);
    			t5 = space();
    			p = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			small = element("small");
    			small.textContent = "Original credit goes to https://codepen.io/genarocolusso/pen/xONEXg";
    			if (img.src !== (img_src_value = "http://placekitten.com/500/500")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "s");
    			attr_dev(img, "class", "svelte-184t2fq");
    			add_location(img, file$4, 12, 35, 232);
    			attr_dev(h1, "class", "svelte-184t2fq");
    			add_location(h1, file$4, 14, 20, 347);
    			attr_dev(h3, "class", "svelte-184t2fq");
    			add_location(h3, file$4, 15, 20, 390);
    			attr_dev(p, "class", "bio svelte-184t2fq");
    			add_location(p, file$4, 16, 20, 434);
    			attr_dev(div0, "class", "profileinfo svelte-184t2fq");
    			add_location(div0, file$4, 13, 16, 301);
    			attr_dev(div1, "class", "firstinfo svelte-184t2fq");
    			add_location(div1, file$4, 12, 12, 209);
    			attr_dev(div2, "class", "card svelte-184t2fq");
    			add_location(div2, file$4, 11, 8, 178);
    			attr_dev(div3, "class", "content svelte-184t2fq");
    			add_location(div3, file$4, 10, 4, 148);
    			attr_dev(small, "class", "svelte-184t2fq");
    			add_location(small, file$4, 26, 4, 964);
    			attr_dev(main, "class", "svelte-184t2fq");
    			add_location(main, file$4, 6, 0, 102);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t0);
    			append_dev(main, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, h3);
    			append_dev(h3, t4);
    			append_dev(div0, t5);
    			append_dev(div0, p);
    			append_dev(p, t6);
    			append_dev(main, t7);
    			append_dev(main, small);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*params*/ 1) && t2_value !== (t2_value = /*params*/ ctx[0].name + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*params*/ 1) && t4_value !== (t4_value = /*params*/ ctx[0].title + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*params*/ 1) && t6_value !== (t6_value = /*params*/ ctx[0].bio + "")) set_data_dev(t6, t6_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PersonalProfile", slots, []);
    	let { params = "" } = $$props;
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PersonalProfile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({ NavBar, params });

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [params];
    }

    class PersonalProfile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PersonalProfile",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get params() {
    		throw new Error("<PersonalProfile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<PersonalProfile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/forms/Signup.svelte generated by Svelte v3.31.0 */

    const file$5 = "src/forms/Signup.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let div6;
    	let div5;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div4;
    	let svg;
    	let defs;
    	let linearGradient;
    	let stop0;
    	let stop1;
    	let path;
    	let t4;
    	let div3;
    	let label0;
    	let t6;
    	let input0;
    	let t7;
    	let label1;
    	let t9;
    	let input1;
    	let t10;
    	let input2;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div6 = element("div");
    			div5 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Login";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "By logging in you agree to the ridiculously long terms that\n                    you didn't bother to read";
    			t3 = space();
    			div4 = element("div");
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			linearGradient = svg_element("linearGradient");
    			stop0 = svg_element("stop");
    			stop1 = svg_element("stop");
    			path = svg_element("path");
    			t4 = space();
    			div3 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			label1 = element("label");
    			label1.textContent = "Password";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			input2 = element("input");
    			attr_dev(div0, "class", "login svelte-1h10psi");
    			add_location(div0, file$5, 59, 16, 1963);
    			attr_dev(div1, "class", "eula svelte-1h10psi");
    			add_location(div1, file$5, 60, 16, 2010);
    			attr_dev(div2, "class", "left svelte-1h10psi");
    			add_location(div2, file$5, 58, 12, 1928);
    			set_style(stop0, "stop-color", "#ff00ff");
    			attr_dev(stop0, "offset", "0");
    			attr_dev(stop0, "id", "stop876");
    			attr_dev(stop0, "class", "svelte-1h10psi");
    			add_location(stop0, file$5, 76, 28, 2689);
    			set_style(stop1, "stop-color", "#ff0000");
    			attr_dev(stop1, "offset", "1");
    			attr_dev(stop1, "id", "stop878");
    			attr_dev(stop1, "class", "svelte-1h10psi");
    			add_location(stop1, file$5, 80, 28, 2874);
    			attr_dev(linearGradient, "inkscape:collect", "always");
    			attr_dev(linearGradient, "id", "linearGradient");
    			attr_dev(linearGradient, "x1", "13");
    			attr_dev(linearGradient, "y1", "193.49992");
    			attr_dev(linearGradient, "x2", "307");
    			attr_dev(linearGradient, "y2", "193.49992");
    			attr_dev(linearGradient, "gradientUnits", "userSpaceOnUse");
    			attr_dev(linearGradient, "class", "svelte-1h10psi");
    			add_location(linearGradient, file$5, 68, 24, 2324);
    			attr_dev(defs, "class", "svelte-1h10psi");
    			add_location(defs, file$5, 67, 20, 2293);
    			attr_dev(path, "d", "m 40,120.00016 239.99984,-3.2e-4 c 0,0 24.99263,0.79932 25.00016,35.00016 0.008,34.20084 -25.00016,35 -25.00016,35 h -239.99984 c 0,-0.0205 -25,4.01348 -25,38.5 0,34.48652 25,38.5 25,38.5 h 215 c 0,0 20,-0.99604 20,-25 0,-24.00396 -20,-25 -20,-25 h -190 c 0,0 -20,1.71033 -20,25 0,24.00396 20,25 20,25 h 168.57143");
    			attr_dev(path, "class", "svelte-1h10psi");
    			add_location(path, file$5, 86, 20, 3121);
    			attr_dev(svg, "viewBox", "0 0 320 300");
    			attr_dev(svg, "class", "svelte-1h10psi");
    			add_location(svg, file$5, 66, 16, 2245);
    			attr_dev(label0, "for", "email");
    			attr_dev(label0, "class", "svelte-1h10psi");
    			add_location(label0, file$5, 90, 20, 3550);
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "id", "email");
    			attr_dev(input0, "class", "svelte-1h10psi");
    			add_location(input0, file$5, 91, 20, 3603);
    			attr_dev(label1, "for", "password");
    			attr_dev(label1, "class", "svelte-1h10psi");
    			add_location(label1, file$5, 92, 20, 3657);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "class", "svelte-1h10psi");
    			add_location(input1, file$5, 93, 20, 3716);
    			attr_dev(input2, "type", "submit");
    			attr_dev(input2, "id", "submit");
    			input2.value = "Submit";
    			attr_dev(input2, "class", "svelte-1h10psi");
    			add_location(input2, file$5, 96, 20, 3912);
    			attr_dev(div3, "class", "form svelte-1h10psi");
    			add_location(div3, file$5, 89, 16, 3511);
    			attr_dev(div4, "class", "right svelte-1h10psi");
    			add_location(div4, file$5, 65, 12, 2209);
    			attr_dev(div5, "class", "container svelte-1h10psi");
    			add_location(div5, file$5, 57, 8, 1892);
    			attr_dev(div6, "class", "page svelte-1h10psi");
    			add_location(div6, file$5, 56, 4, 1865);
    			attr_dev(main, "class", "svelte-1h10psi");
    			add_location(main, file$5, 55, 0, 1854);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, svg);
    			append_dev(svg, defs);
    			append_dev(defs, linearGradient);
    			append_dev(linearGradient, stop0);
    			append_dev(linearGradient, stop1);
    			append_dev(svg, path);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, label0);
    			append_dev(div3, t6);
    			append_dev(div3, input0);
    			append_dev(div3, t7);
    			append_dev(div3, label1);
    			append_dev(div3, t9);
    			append_dev(div3, input1);
    			append_dev(div3, t10);
    			append_dev(div3, input2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Signup", slots, []);
    	let current = null;

    	setTimeout(
    		() => {
    			document.getElementById("email").addEventListener("focus", function (e) {
    				if (current) current.pause();

    				current = anime({
    					targets: "path",
    					strokeDashoffset: {
    						value: 0,
    						duration: 700,
    						easing: "easeOutQuart"
    					},
    					strokeDasharray: {
    						value: "240 1386",
    						duration: 700,
    						easing: "easeOutQuart"
    					}
    				});
    			});

    			document.getElementById("password").addEventListener("focus", function (e) {
    				if (current) current.pause();

    				current = anime({
    					targets: "path",
    					strokeDashoffset: {
    						value: -336,
    						duration: 700,
    						easing: "easeOutQuart"
    					},
    					strokeDasharray: {
    						value: "240 1386",
    						duration: 700,
    						easing: "easeOutQuart"
    					}
    				});
    			});

    			document.getElementById("submit").addEventListener("focus", function (e) {
    				if (current) current.pause();

    				current = anime({
    					targets: "path",
    					strokeDashoffset: {
    						value: -730,
    						duration: 700,
    						easing: "easeOutQuart"
    					},
    					strokeDasharray: {
    						value: "530 1386",
    						duration: 700,
    						easing: "easeOutQuart"
    					}
    				});
    			});
    		},
    		1000
    	);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Signup> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ current });

    	$$self.$inject_state = $$props => {
    		if ("current" in $$props) current = $$props.current;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Signup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Signup",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/forms/Login.svelte generated by Svelte v3.31.0 */

    const file$6 = "src/forms/Login.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let div6;
    	let div5;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div4;
    	let svg;
    	let defs;
    	let linearGradient;
    	let stop0;
    	let stop1;
    	let path;
    	let t4;
    	let div3;
    	let label0;
    	let t6;
    	let input0;
    	let t7;
    	let label1;
    	let t9;
    	let input1;
    	let t10;
    	let input2;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div6 = element("div");
    			div5 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Login";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "By logging in you agree to the ridiculously long terms that\n                    you didn't bother to read";
    			t3 = space();
    			div4 = element("div");
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			linearGradient = svg_element("linearGradient");
    			stop0 = svg_element("stop");
    			stop1 = svg_element("stop");
    			path = svg_element("path");
    			t4 = space();
    			div3 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			label1 = element("label");
    			label1.textContent = "Password";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			input2 = element("input");
    			attr_dev(div0, "class", "login svelte-1h10psi");
    			add_location(div0, file$6, 59, 16, 1963);
    			attr_dev(div1, "class", "eula svelte-1h10psi");
    			add_location(div1, file$6, 60, 16, 2010);
    			attr_dev(div2, "class", "left svelte-1h10psi");
    			add_location(div2, file$6, 58, 12, 1928);
    			set_style(stop0, "stop-color", "#ff00ff");
    			attr_dev(stop0, "offset", "0");
    			attr_dev(stop0, "id", "stop876");
    			attr_dev(stop0, "class", "svelte-1h10psi");
    			add_location(stop0, file$6, 76, 28, 2689);
    			set_style(stop1, "stop-color", "#ff0000");
    			attr_dev(stop1, "offset", "1");
    			attr_dev(stop1, "id", "stop878");
    			attr_dev(stop1, "class", "svelte-1h10psi");
    			add_location(stop1, file$6, 80, 28, 2874);
    			attr_dev(linearGradient, "inkscape:collect", "always");
    			attr_dev(linearGradient, "id", "linearGradient");
    			attr_dev(linearGradient, "x1", "13");
    			attr_dev(linearGradient, "y1", "193.49992");
    			attr_dev(linearGradient, "x2", "307");
    			attr_dev(linearGradient, "y2", "193.49992");
    			attr_dev(linearGradient, "gradientUnits", "userSpaceOnUse");
    			attr_dev(linearGradient, "class", "svelte-1h10psi");
    			add_location(linearGradient, file$6, 68, 24, 2324);
    			attr_dev(defs, "class", "svelte-1h10psi");
    			add_location(defs, file$6, 67, 20, 2293);
    			attr_dev(path, "d", "m 40,120.00016 239.99984,-3.2e-4 c 0,0 24.99263,0.79932 25.00016,35.00016 0.008,34.20084 -25.00016,35 -25.00016,35 h -239.99984 c 0,-0.0205 -25,4.01348 -25,38.5 0,34.48652 25,38.5 25,38.5 h 215 c 0,0 20,-0.99604 20,-25 0,-24.00396 -20,-25 -20,-25 h -190 c 0,0 -20,1.71033 -20,25 0,24.00396 20,25 20,25 h 168.57143");
    			attr_dev(path, "class", "svelte-1h10psi");
    			add_location(path, file$6, 86, 20, 3121);
    			attr_dev(svg, "viewBox", "0 0 320 300");
    			attr_dev(svg, "class", "svelte-1h10psi");
    			add_location(svg, file$6, 66, 16, 2245);
    			attr_dev(label0, "for", "email");
    			attr_dev(label0, "class", "svelte-1h10psi");
    			add_location(label0, file$6, 90, 20, 3550);
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "id", "email");
    			attr_dev(input0, "class", "svelte-1h10psi");
    			add_location(input0, file$6, 91, 20, 3603);
    			attr_dev(label1, "for", "password");
    			attr_dev(label1, "class", "svelte-1h10psi");
    			add_location(label1, file$6, 92, 20, 3657);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "class", "svelte-1h10psi");
    			add_location(input1, file$6, 93, 20, 3716);
    			attr_dev(input2, "type", "submit");
    			attr_dev(input2, "id", "submit");
    			input2.value = "Submit";
    			attr_dev(input2, "class", "svelte-1h10psi");
    			add_location(input2, file$6, 94, 20, 3776);
    			attr_dev(div3, "class", "form svelte-1h10psi");
    			add_location(div3, file$6, 89, 16, 3511);
    			attr_dev(div4, "class", "right svelte-1h10psi");
    			add_location(div4, file$6, 65, 12, 2209);
    			attr_dev(div5, "class", "container svelte-1h10psi");
    			add_location(div5, file$6, 57, 8, 1892);
    			attr_dev(div6, "class", "page svelte-1h10psi");
    			add_location(div6, file$6, 56, 4, 1865);
    			attr_dev(main, "class", "svelte-1h10psi");
    			add_location(main, file$6, 55, 0, 1854);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, svg);
    			append_dev(svg, defs);
    			append_dev(defs, linearGradient);
    			append_dev(linearGradient, stop0);
    			append_dev(linearGradient, stop1);
    			append_dev(svg, path);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, label0);
    			append_dev(div3, t6);
    			append_dev(div3, input0);
    			append_dev(div3, t7);
    			append_dev(div3, label1);
    			append_dev(div3, t9);
    			append_dev(div3, input1);
    			append_dev(div3, t10);
    			append_dev(div3, input2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);
    	let current = null;

    	setTimeout(
    		() => {
    			document.getElementById("email").addEventListener("focus", function (e) {
    				if (current) current.pause();

    				current = anime({
    					targets: "path",
    					strokeDashoffset: {
    						value: 0,
    						duration: 700,
    						easing: "easeOutQuart"
    					},
    					strokeDasharray: {
    						value: "240 1386",
    						duration: 700,
    						easing: "easeOutQuart"
    					}
    				});
    			});

    			document.getElementById("password").addEventListener("focus", function (e) {
    				if (current) current.pause();

    				current = anime({
    					targets: "path",
    					strokeDashoffset: {
    						value: -336,
    						duration: 700,
    						easing: "easeOutQuart"
    					},
    					strokeDasharray: {
    						value: "240 1386",
    						duration: 700,
    						easing: "easeOutQuart"
    					}
    				});
    			});

    			document.getElementById("submit").addEventListener("focus", function (e) {
    				if (current) current.pause();

    				current = anime({
    					targets: "path",
    					strokeDashoffset: {
    						value: -730,
    						duration: 700,
    						easing: "easeOutQuart"
    					},
    					strokeDasharray: {
    						value: "530 1386",
    						duration: 700,
    						easing: "easeOutQuart"
    					}
    				});
    			});
    		},
    		1000
    	);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ current });

    	$$self.$inject_state = $$props => {
    		if ("current" in $$props) current = $$props.current;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/EULA/EULA.svelte generated by Svelte v3.31.0 */

    const file$7 = "src/EULA/EULA.svelte";

    function create_fragment$7(ctx) {
    	let main0;
    	let t0;
    	let main1;
    	let t1;
    	let br0;
    	let t2;
    	let br1;
    	let br2;
    	let br3;
    	let t3;
    	let br4;
    	let br5;
    	let t4;
    	let br6;
    	let br7;
    	let t5;
    	let br8;
    	let br9;
    	let t6;
    	let br10;
    	let t7;
    	let br11;
    	let br12;
    	let t8;
    	let br13;
    	let br14;
    	let t9;
    	let br15;
    	let br16;
    	let t10;
    	let br17;
    	let br18;
    	let t11;
    	let br19;
    	let t12;
    	let br20;
    	let t13;
    	let br21;
    	let br22;
    	let t14;
    	let br23;
    	let br24;
    	let t15;
    	let br25;
    	let br26;
    	let t16;
    	let br27;
    	let br28;
    	let t17;
    	let br29;
    	let t18;
    	let br30;
    	let t19;
    	let br31;
    	let br32;
    	let t20;
    	let br33;
    	let br34;
    	let t21;
    	let br35;
    	let br36;
    	let t22;
    	let br37;
    	let br38;
    	let t23;
    	let br39;
    	let br40;
    	let t24;
    	let br41;
    	let br42;
    	let t25;
    	let br43;
    	let br44;
    	let t26;
    	let br45;
    	let br46;
    	let t27;
    	let br47;
    	let br48;
    	let t28;
    	let br49;
    	let br50;
    	let t29;
    	let br51;
    	let br52;
    	let t30;
    	let br53;
    	let br54;
    	let t31;
    	let br55;
    	let br56;
    	let t32;
    	let br57;
    	let br58;
    	let t33;
    	let br59;
    	let br60;
    	let t34;
    	let br61;
    	let br62;
    	let t35;
    	let br63;
    	let br64;
    	let t36;
    	let br65;
    	let br66;
    	let t37;
    	let br67;
    	let br68;
    	let t38;
    	let br69;
    	let br70;
    	let t39;
    	let br71;
    	let br72;
    	let t40;
    	let br73;
    	let br74;
    	let t41;
    	let br75;
    	let br76;
    	let t42;
    	let br77;
    	let br78;
    	let t43;
    	let br79;
    	let br80;
    	let t44;
    	let br81;
    	let br82;
    	let t45;
    	let br83;
    	let br84;
    	let t46;
    	let br85;
    	let br86;
    	let t47;
    	let br87;
    	let br88;
    	let t48;
    	let br89;
    	let br90;
    	let t49;
    	let br91;
    	let br92;
    	let t50;
    	let br93;
    	let br94;
    	let t51;
    	let br95;
    	let br96;
    	let t52;
    	let br97;
    	let br98;
    	let t53;
    	let br99;
    	let br100;
    	let t54;
    	let br101;
    	let br102;
    	let t55;
    	let br103;
    	let br104;
    	let t56;
    	let br105;
    	let br106;
    	let br107;

    	const block = {
    		c: function create() {
    			main0 = element("main");
    			t0 = space();
    			main1 = element("main");
    			t1 = text("Contractology.com\n\nTEMPLATE WEBSITE TERMS AND CONDITIONS\n\n\nCredit\n\nThis document was created using a Contractology template available at http://www.contractology.com.\n\nIntroduction\n\nThese terms and conditions govern your use of this website; by using this website, you accept these terms and conditions in full.   If you disagree with these terms and conditions or any part of these terms and conditions, you must not use this website. \n\n[You must be at least [18] years of age to use this website.  By using this website [and by agreeing to these terms and conditions] you warrant and represent that you are at least [18] years of age.]\n\n[This website uses cookies.  By using this website and agreeing to these terms and conditions, you consent to our [NAME]'s use of cookies in accordance with the terms of [NAME]'s [privacy policy / cookies policy].]\n\nLicense to use website\n\nUnless otherwise stated, [NAME] and/or its licensors own the intellectual property rights in the website and material on the website.  Subject to the license below, all these intellectual property rights are reserved.\n\nYou may view, download for caching purposes only, and print pages [or [OTHER CONTENT]] from the website for your own personal use, subject to the restrictions set out below and elsewhere in these terms and conditions.  \n\nYou must not:\n\n    • republish material from this website (including republication on another website);\n    • sell, rent or sub-license material from the website;\n    • show any material from the website in public;\n    • reproduce, duplicate, copy or otherwise exploit material on this website for a commercial purpose;]\n    • [edit or otherwise modify any material on the website; or]\n    • [redistribute material from this website [except for content specifically and expressly made available for redistribution].]\n\n[Where content is specifically made available for redistribution, it may only be redistributed [within your organisation].]\n\nAcceptable use\n\nYou must not use this website in any way that causes, or may cause, damage to the website or impairment of the availability or accessibility of the website; or in any way which is unlawful, illegal, fraudulent or harmful, or in connection with any unlawful, illegal, fraudulent or harmful purpose or activity.\n\nYou must not use this website to copy, store, host, transmit, send, use, publish or distribute any material which consists of (or is linked to) any spyware, computer virus, Trojan horse, worm, keystroke logger, rootkit or other malicious computer software.\n\nYou must not conduct any systematic or automated data collection activities (including without limitation scraping, data mining, data extraction and data harvesting) on or in relation to this website without [NAME'S] express written consent.\n\n[You must not use this website to transmit or send unsolicited commercial communications.]\n\n[You must not use this website for any purposes related to marketing without [NAME'S] express written consent.]  \n\n[Restricted access\n\n[Access to certain areas of this website is restricted.]  [NAME] reserves the right to restrict access to [other] areas of this website, or indeed this entire website, at [NAME'S] discretion.\n\nIf [NAME] provides you with a user ID and password to enable you to access restricted areas of this website or other content or services, you must ensure that the user ID and password are kept confidential.  \n\n[[NAME] may disable your user ID and password in [NAME'S] sole discretion without notice or explanation.]\n\n[User content\n\nIn these terms and conditions, “your user content” means material (including without limitation text, images, audio material, video material and audio-visual material) that you submit to this website, for whatever purpose.\n\nYou grant to [NAME] a worldwide, irrevocable, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate and distribute your user content in any existing or future media.  You also grant to [NAME] the right to sub-license these rights, and the right to bring an action for infringement of these rights.\n\nYour user content must not be illegal or unlawful, must not infringe any third party's legal rights, and must not be capable of giving rise to legal action whether against you or [NAME] or a third party (in each case under any applicable law).  \n\nYou must not submit any user content to the website that is or has ever been the subject of any threatened or actual legal proceedings or other similar complaint.\n\n[NAME] reserves the right to edit or remove any material submitted to this website, or stored on [NAME'S] servers, or hosted or published upon this website.\n");
    			br0 = element("br");
    			t2 = text("[Notwithstanding [NAME'S] rights under these terms and conditions in relation to user content, [NAME] does not undertake to monitor the submission of such content to, or the publication of such content on, this website.]");
    			br1 = element("br");
    			br2 = element("br");
    			br3 = element("br");
    			t3 = text("No warranties");
    			br4 = element("br");
    			br5 = element("br");
    			t4 = text("This website is provided “as is” without any representations or warranties, express or implied.  [NAME] makes no representations or warranties in relation to this website or the information and materials provided on this website.  ");
    			br6 = element("br");
    			br7 = element("br");
    			t5 = text("Without prejudice to the generality of the foregoing paragraph, [NAME] does not warrant that:");
    			br8 = element("br");
    			br9 = element("br");
    			t6 = text("    • this website will be constantly available, or available at all; or");
    			br10 = element("br");
    			t7 = text("    • the information on this website is complete, true, accurate or non-misleading.");
    			br11 = element("br");
    			br12 = element("br");
    			t8 = text("Nothing on this website constitutes, or is meant to constitute, advice of any kind.  [If you require advice in relation to any [legal, financial or medical] matter you should consult an appropriate professional.]");
    			br13 = element("br");
    			br14 = element("br");
    			t9 = text("Limitations of liability");
    			br15 = element("br");
    			br16 = element("br");
    			t10 = text("[NAME] will not be liable to you (whether under the law of contact, the law of torts or otherwise) in relation to the contents of, or use of, or otherwise in connection with, this website:");
    			br17 = element("br");
    			br18 = element("br");
    			t11 = text("    • [to the extent that the website is provided free-of-charge, for any direct loss;]");
    			br19 = element("br");
    			t12 = text("    • for any indirect, special or consequential loss; or");
    			br20 = element("br");
    			t13 = text("    • for any business losses, loss of revenue, income, profits or anticipated savings, loss of contracts or business relationships, loss of reputation or goodwill, or loss or corruption of information or data.");
    			br21 = element("br");
    			br22 = element("br");
    			t14 = text("These limitations of liability apply even if [NAME] has been expressly advised of the potential loss.");
    			br23 = element("br");
    			br24 = element("br");
    			t15 = text("Exceptions");
    			br25 = element("br");
    			br26 = element("br");
    			t16 = text("Nothing in this website disclaimer will exclude or limit any warranty implied by law that it would be unlawful to exclude or limit; and nothing in this website disclaimer will exclude or limit [NAME'S] liability in respect of any:");
    			br27 = element("br");
    			br28 = element("br");
    			t17 = text("    • death or personal injury caused by [NAME'S] negligence;");
    			br29 = element("br");
    			t18 = text("    • fraud or fraudulent misrepresentation on the part of [NAME]; or");
    			br30 = element("br");
    			t19 = text("    • matter which it would be illegal or unlawful for [NAME] to exclude or limit, or to attempt or purport to exclude or limit, its liability. ");
    			br31 = element("br");
    			br32 = element("br");
    			t20 = text("Reasonableness");
    			br33 = element("br");
    			br34 = element("br");
    			t21 = text("By using this website, you agree that the exclusions and limitations of liability set out in this website disclaimer are reasonable.  ");
    			br35 = element("br");
    			br36 = element("br");
    			t22 = text("If you do not think they are reasonable, you must not use this website.");
    			br37 = element("br");
    			br38 = element("br");
    			t23 = text("Other parties");
    			br39 = element("br");
    			br40 = element("br");
    			t24 = text("[You accept that, as a limited liability entity, [NAME] has an interest in limiting the personal liability of its officers and employees.  You agree that you will not bring any claim personally against [NAME'S] officers or employees in respect of any losses you suffer in connection with the website.]");
    			br41 = element("br");
    			br42 = element("br");
    			t25 = text("[Without prejudice to the foregoing paragraph,] you agree that the limitations of warranties and liability set out in this website disclaimer will protect [NAME'S] officers, employees, agents, subsidiaries, successors, assigns and sub-contractors as well as [NAME]. ");
    			br43 = element("br");
    			br44 = element("br");
    			t26 = text("Unenforceable provisions");
    			br45 = element("br");
    			br46 = element("br");
    			t27 = text("If any provision of this website disclaimer is, or is found to be, unenforceable under applicable law, that will not affect the enforceability of the other provisions of this website disclaimer.");
    			br47 = element("br");
    			br48 = element("br");
    			t28 = text("Indemnity");
    			br49 = element("br");
    			br50 = element("br");
    			t29 = text("You hereby indemnify [NAME] and undertake to keep [NAME] indemnified against any losses, damages, costs, liabilities and expenses (including without limitation legal expenses and any amounts paid by [NAME] to a third party in settlement of a claim or dispute on the advice of [NAME'S] legal advisers) incurred or suffered by [NAME] arising out of any breach by you of any provision of these terms and conditions[, or arising out of any claim that you have breached any provision of these terms and conditions].");
    			br51 = element("br");
    			br52 = element("br");
    			t30 = text("Breaches of these terms and conditions");
    			br53 = element("br");
    			br54 = element("br");
    			t31 = text("Without prejudice to [NAME'S] other rights under these terms and conditions, if you breach these terms and conditions in any way, [NAME] may take such action as [NAME] deems appropriate to deal with the breach, including suspending your access to the website, prohibiting you from accessing the website, blocking computers using your IP address from accessing the website, contacting your internet service provider to request that they block your access to the website and/or bringing court proceedings against you.");
    			br55 = element("br");
    			br56 = element("br");
    			t32 = text("Variation");
    			br57 = element("br");
    			br58 = element("br");
    			t33 = text("[NAME] may revise these terms and conditions from time-to-time.  Revised terms and conditions will apply to the use of this website from the date of the publication of the revised terms and conditions on this website.  Please check this page regularly to ensure you are familiar with the current version.");
    			br59 = element("br");
    			br60 = element("br");
    			t34 = text("Assignment");
    			br61 = element("br");
    			br62 = element("br");
    			t35 = text("[NAME] may transfer, sub-contract or otherwise deal with [NAME'S] rights and/or obligations under these terms and conditions without notifying you or obtaining your consent.");
    			br63 = element("br");
    			br64 = element("br");
    			t36 = text("You may not transfer, sub-contract or otherwise deal with your rights and/or obligations under these terms and conditions.  ");
    			br65 = element("br");
    			br66 = element("br");
    			t37 = text("Severability");
    			br67 = element("br");
    			br68 = element("br");
    			t38 = text("If a provision of these terms and conditions is determined by any court or other competent authority to be unlawful and/or unenforceable, the other provisions will continue in effect.  If any unlawful and/or unenforceable provision would be lawful or enforceable if part of it were deleted, that part will be deemed to be deleted, and the rest of the provision will continue in effect. ");
    			br69 = element("br");
    			br70 = element("br");
    			t39 = text("Entire agreement");
    			br71 = element("br");
    			br72 = element("br");
    			t40 = text("These terms and conditions [, together with [DOCUMENTS],] constitute the entire agreement between you and [NAME] in relation to your use of this website, and supersede all previous agreements in respect of your use of this website.");
    			br73 = element("br");
    			br74 = element("br");
    			t41 = text("Law and jurisdiction");
    			br75 = element("br");
    			br76 = element("br");
    			t42 = text("These terms and conditions will be governed by and construed in accordance with [GOVERNING LAW], and any disputes relating to these terms and conditions will be subject to the [non-]exclusive jurisdiction of the courts of [JURISDICTION].");
    			br77 = element("br");
    			br78 = element("br");
    			t43 = text("[Registrations and authorisations");
    			br79 = element("br");
    			br80 = element("br");
    			t44 = text("[[NAME] is registered with [TRADE REGISTER].  You can find the online version of the register at [URL].  [NAME'S] registration number is [NUMBER].]");
    			br81 = element("br");
    			br82 = element("br");
    			t45 = text("[[NAME] is subject to [AUTHORISATION SCHEME], which is supervised by [SUPERVISORY AUTHORITY].]");
    			br83 = element("br");
    			br84 = element("br");
    			t46 = text("[[NAME] is registered with [PROFESSIONAL BODY].  [NAME'S] professional title is [TITLE] and it has been granted in the United Kingdom.  [NAME] is subject to the [RULES] which can be found at [URL].]");
    			br85 = element("br");
    			br86 = element("br");
    			t47 = text("[[NAME] subscribes to the following code[s] of conduct: [CODE(S) OF CONDUCT].  [These codes/this code] can be consulted electronically at [URL(S)].");
    			br87 = element("br");
    			br88 = element("br");
    			t48 = text("[[NAME'S] [TAX] number is [NUMBER].]]");
    			br89 = element("br");
    			br90 = element("br");
    			t49 = text("[NAME'S] details");
    			br91 = element("br");
    			br92 = element("br");
    			t50 = text("The full name of [NAME] is [FULL NAME].  ");
    			br93 = element("br");
    			br94 = element("br");
    			t51 = text("[[NAME] is registered in [JURISDICTION] under registration number [NUMBER].]  ");
    			br95 = element("br");
    			br96 = element("br");
    			t52 = text("[NAME'S] [registered] address is [ADDRESS].  ");
    			br97 = element("br");
    			br98 = element("br");
    			t53 = text("You can contact [NAME] by email to [EMAIL].");
    			br99 = element("br");
    			br100 = element("br");
    			t54 = text("You must retain the \"Credit\" section in this document. If you wish to use the document without the \"Credit\" section (e.g. to project a more professional image) then you can get a license to do so here:");
    			br101 = element("br");
    			br102 = element("br");
    			t55 = text("http://www.contractology.com/free-document-license-website-terms-and-conditions.html");
    			br103 = element("br");
    			br104 = element("br");
    			t56 = text("It is an infringement of our copyright to use the document without the \"Credit\" section and without paying the license fee.");
    			br105 = element("br");
    			br106 = element("br");
    			br107 = element("br");
    			add_location(main0, file$7, 4, 0, 21);
    			add_location(br0, file$7, 74, 0, 4709);
    			add_location(br1, file$7, 74, 224, 4933);
    			add_location(br2, file$7, 74, 228, 4937);
    			add_location(br3, file$7, 74, 232, 4941);
    			add_location(br4, file$7, 74, 249, 4958);
    			add_location(br5, file$7, 74, 253, 4962);
    			add_location(br6, file$7, 74, 488, 5197);
    			add_location(br7, file$7, 74, 492, 5201);
    			add_location(br8, file$7, 74, 589, 5298);
    			add_location(br9, file$7, 74, 593, 5302);
    			add_location(br10, file$7, 74, 669, 5378);
    			add_location(br11, file$7, 74, 757, 5466);
    			add_location(br12, file$7, 74, 761, 5470);
    			add_location(br13, file$7, 74, 977, 5686);
    			add_location(br14, file$7, 74, 981, 5690);
    			add_location(br15, file$7, 74, 1009, 5718);
    			add_location(br16, file$7, 74, 1013, 5722);
    			add_location(br17, file$7, 74, 1205, 5914);
    			add_location(br18, file$7, 74, 1209, 5918);
    			add_location(br19, file$7, 74, 1300, 6009);
    			add_location(br20, file$7, 74, 1361, 6070);
    			add_location(br21, file$7, 74, 1575, 6284);
    			add_location(br22, file$7, 74, 1579, 6288);
    			add_location(br23, file$7, 74, 1684, 6393);
    			add_location(br24, file$7, 74, 1688, 6397);
    			add_location(br25, file$7, 74, 1702, 6411);
    			add_location(br26, file$7, 74, 1706, 6415);
    			add_location(br27, file$7, 74, 1940, 6649);
    			add_location(br28, file$7, 74, 1944, 6653);
    			add_location(br29, file$7, 74, 2009, 6718);
    			add_location(br30, file$7, 74, 2082, 6791);
    			add_location(br31, file$7, 74, 2230, 6939);
    			add_location(br32, file$7, 74, 2234, 6943);
    			add_location(br33, file$7, 74, 2252, 6961);
    			add_location(br34, file$7, 74, 2256, 6965);
    			add_location(br35, file$7, 74, 2394, 7103);
    			add_location(br36, file$7, 74, 2398, 7107);
    			add_location(br37, file$7, 74, 2473, 7182);
    			add_location(br38, file$7, 74, 2477, 7186);
    			add_location(br39, file$7, 74, 2494, 7203);
    			add_location(br40, file$7, 74, 2498, 7207);
    			add_location(br41, file$7, 74, 2803, 7512);
    			add_location(br42, file$7, 74, 2807, 7516);
    			add_location(br43, file$7, 74, 3077, 7786);
    			add_location(br44, file$7, 74, 3081, 7790);
    			add_location(br45, file$7, 74, 3109, 7818);
    			add_location(br46, file$7, 74, 3113, 7822);
    			add_location(br47, file$7, 74, 3311, 8020);
    			add_location(br48, file$7, 74, 3315, 8024);
    			add_location(br49, file$7, 74, 3328, 8037);
    			add_location(br50, file$7, 74, 3332, 8041);
    			add_location(br51, file$7, 74, 3846, 8555);
    			add_location(br52, file$7, 74, 3850, 8559);
    			add_location(br53, file$7, 74, 3892, 8601);
    			add_location(br54, file$7, 74, 3896, 8605);
    			add_location(br55, file$7, 74, 4415, 9124);
    			add_location(br56, file$7, 74, 4419, 9128);
    			add_location(br57, file$7, 74, 4432, 9141);
    			add_location(br58, file$7, 74, 4436, 9145);
    			add_location(br59, file$7, 74, 4744, 9453);
    			add_location(br60, file$7, 74, 4748, 9457);
    			add_location(br61, file$7, 74, 4762, 9471);
    			add_location(br62, file$7, 74, 4766, 9475);
    			add_location(br63, file$7, 74, 4943, 9652);
    			add_location(br64, file$7, 74, 4947, 9656);
    			add_location(br65, file$7, 74, 5075, 9784);
    			add_location(br66, file$7, 74, 5079, 9788);
    			add_location(br67, file$7, 74, 5095, 9804);
    			add_location(br68, file$7, 74, 5099, 9808);
    			add_location(br69, file$7, 74, 5489, 10198);
    			add_location(br70, file$7, 74, 5493, 10202);
    			add_location(br71, file$7, 74, 5513, 10222);
    			add_location(br72, file$7, 74, 5517, 10226);
    			add_location(br73, file$7, 74, 5752, 10461);
    			add_location(br74, file$7, 74, 5756, 10465);
    			add_location(br75, file$7, 74, 5780, 10489);
    			add_location(br76, file$7, 74, 5784, 10493);
    			add_location(br77, file$7, 74, 6025, 10734);
    			add_location(br78, file$7, 74, 6029, 10738);
    			add_location(br79, file$7, 74, 6066, 10775);
    			add_location(br80, file$7, 74, 6070, 10779);
    			add_location(br81, file$7, 74, 6221, 10930);
    			add_location(br82, file$7, 74, 6225, 10934);
    			add_location(br83, file$7, 74, 6323, 11032);
    			add_location(br84, file$7, 74, 6327, 11036);
    			add_location(br85, file$7, 74, 6529, 11238);
    			add_location(br86, file$7, 74, 6533, 11242);
    			add_location(br87, file$7, 74, 6684, 11393);
    			add_location(br88, file$7, 74, 6688, 11397);
    			add_location(br89, file$7, 74, 6729, 11438);
    			add_location(br90, file$7, 74, 6733, 11442);
    			add_location(br91, file$7, 74, 6753, 11462);
    			add_location(br92, file$7, 74, 6757, 11466);
    			add_location(br93, file$7, 74, 6802, 11511);
    			add_location(br94, file$7, 74, 6806, 11515);
    			add_location(br95, file$7, 74, 6888, 11597);
    			add_location(br96, file$7, 74, 6892, 11601);
    			add_location(br97, file$7, 74, 6941, 11650);
    			add_location(br98, file$7, 74, 6945, 11654);
    			add_location(br99, file$7, 74, 6992, 11701);
    			add_location(br100, file$7, 74, 6996, 11705);
    			add_location(br101, file$7, 74, 7201, 11910);
    			add_location(br102, file$7, 74, 7205, 11914);
    			add_location(br103, file$7, 74, 7293, 12002);
    			add_location(br104, file$7, 74, 7297, 12006);
    			add_location(br105, file$7, 74, 7424, 12133);
    			add_location(br106, file$7, 74, 7428, 12137);
    			add_location(br107, file$7, 74, 7432, 12141);
    			add_location(main1, file$7, 8, 0, 38);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main1, anchor);
    			append_dev(main1, t1);
    			append_dev(main1, br0);
    			append_dev(main1, t2);
    			append_dev(main1, br1);
    			append_dev(main1, br2);
    			append_dev(main1, br3);
    			append_dev(main1, t3);
    			append_dev(main1, br4);
    			append_dev(main1, br5);
    			append_dev(main1, t4);
    			append_dev(main1, br6);
    			append_dev(main1, br7);
    			append_dev(main1, t5);
    			append_dev(main1, br8);
    			append_dev(main1, br9);
    			append_dev(main1, t6);
    			append_dev(main1, br10);
    			append_dev(main1, t7);
    			append_dev(main1, br11);
    			append_dev(main1, br12);
    			append_dev(main1, t8);
    			append_dev(main1, br13);
    			append_dev(main1, br14);
    			append_dev(main1, t9);
    			append_dev(main1, br15);
    			append_dev(main1, br16);
    			append_dev(main1, t10);
    			append_dev(main1, br17);
    			append_dev(main1, br18);
    			append_dev(main1, t11);
    			append_dev(main1, br19);
    			append_dev(main1, t12);
    			append_dev(main1, br20);
    			append_dev(main1, t13);
    			append_dev(main1, br21);
    			append_dev(main1, br22);
    			append_dev(main1, t14);
    			append_dev(main1, br23);
    			append_dev(main1, br24);
    			append_dev(main1, t15);
    			append_dev(main1, br25);
    			append_dev(main1, br26);
    			append_dev(main1, t16);
    			append_dev(main1, br27);
    			append_dev(main1, br28);
    			append_dev(main1, t17);
    			append_dev(main1, br29);
    			append_dev(main1, t18);
    			append_dev(main1, br30);
    			append_dev(main1, t19);
    			append_dev(main1, br31);
    			append_dev(main1, br32);
    			append_dev(main1, t20);
    			append_dev(main1, br33);
    			append_dev(main1, br34);
    			append_dev(main1, t21);
    			append_dev(main1, br35);
    			append_dev(main1, br36);
    			append_dev(main1, t22);
    			append_dev(main1, br37);
    			append_dev(main1, br38);
    			append_dev(main1, t23);
    			append_dev(main1, br39);
    			append_dev(main1, br40);
    			append_dev(main1, t24);
    			append_dev(main1, br41);
    			append_dev(main1, br42);
    			append_dev(main1, t25);
    			append_dev(main1, br43);
    			append_dev(main1, br44);
    			append_dev(main1, t26);
    			append_dev(main1, br45);
    			append_dev(main1, br46);
    			append_dev(main1, t27);
    			append_dev(main1, br47);
    			append_dev(main1, br48);
    			append_dev(main1, t28);
    			append_dev(main1, br49);
    			append_dev(main1, br50);
    			append_dev(main1, t29);
    			append_dev(main1, br51);
    			append_dev(main1, br52);
    			append_dev(main1, t30);
    			append_dev(main1, br53);
    			append_dev(main1, br54);
    			append_dev(main1, t31);
    			append_dev(main1, br55);
    			append_dev(main1, br56);
    			append_dev(main1, t32);
    			append_dev(main1, br57);
    			append_dev(main1, br58);
    			append_dev(main1, t33);
    			append_dev(main1, br59);
    			append_dev(main1, br60);
    			append_dev(main1, t34);
    			append_dev(main1, br61);
    			append_dev(main1, br62);
    			append_dev(main1, t35);
    			append_dev(main1, br63);
    			append_dev(main1, br64);
    			append_dev(main1, t36);
    			append_dev(main1, br65);
    			append_dev(main1, br66);
    			append_dev(main1, t37);
    			append_dev(main1, br67);
    			append_dev(main1, br68);
    			append_dev(main1, t38);
    			append_dev(main1, br69);
    			append_dev(main1, br70);
    			append_dev(main1, t39);
    			append_dev(main1, br71);
    			append_dev(main1, br72);
    			append_dev(main1, t40);
    			append_dev(main1, br73);
    			append_dev(main1, br74);
    			append_dev(main1, t41);
    			append_dev(main1, br75);
    			append_dev(main1, br76);
    			append_dev(main1, t42);
    			append_dev(main1, br77);
    			append_dev(main1, br78);
    			append_dev(main1, t43);
    			append_dev(main1, br79);
    			append_dev(main1, br80);
    			append_dev(main1, t44);
    			append_dev(main1, br81);
    			append_dev(main1, br82);
    			append_dev(main1, t45);
    			append_dev(main1, br83);
    			append_dev(main1, br84);
    			append_dev(main1, t46);
    			append_dev(main1, br85);
    			append_dev(main1, br86);
    			append_dev(main1, t47);
    			append_dev(main1, br87);
    			append_dev(main1, br88);
    			append_dev(main1, t48);
    			append_dev(main1, br89);
    			append_dev(main1, br90);
    			append_dev(main1, t49);
    			append_dev(main1, br91);
    			append_dev(main1, br92);
    			append_dev(main1, t50);
    			append_dev(main1, br93);
    			append_dev(main1, br94);
    			append_dev(main1, t51);
    			append_dev(main1, br95);
    			append_dev(main1, br96);
    			append_dev(main1, t52);
    			append_dev(main1, br97);
    			append_dev(main1, br98);
    			append_dev(main1, t53);
    			append_dev(main1, br99);
    			append_dev(main1, br100);
    			append_dev(main1, t54);
    			append_dev(main1, br101);
    			append_dev(main1, br102);
    			append_dev(main1, t55);
    			append_dev(main1, br103);
    			append_dev(main1, br104);
    			append_dev(main1, t56);
    			append_dev(main1, br105);
    			append_dev(main1, br106);
    			append_dev(main1, br107);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EULA", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EULA> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class EULA extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EULA",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */

    function create_fragment$8(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*page*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*params*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*page*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let page$1;
    	let params;

    	// Set up pages to watch for
    	page("/", () => $$invalidate(0, page$1 = Home));

    	page("/signup", () => $$invalidate(0, page$1 = Signup));
    	page("/login", () => $$invalidate(0, page$1 = Login));
    	page("/terms", () => $$invalidate(0, page$1 = EULA));
    	page("/questions", () => $$invalidate(0, page$1 = Questions));

    	page("/profile", () => {
    		$$invalidate(0, page$1 = PersonalProfile);

    		$$invalidate(1, params = {
    			name: "gaetgu",
    			title: "Svelte Dude",
    			bio: "Just a normal ICE agent from Iceland."
    		});
    	});

    	// Set up the router to start and actively watch for changes
    	page.start();

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		router: page,
    		Home,
    		Questions,
    		PersonalProfile,
    		Signup,
    		Login,
    		EULA,
    		page: page$1,
    		params
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page$1 = $$props.page);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page$1, params];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}(constants));
//# sourceMappingURL=bundle.js.map
