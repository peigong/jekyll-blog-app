//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
      function(object){ return object instanceof Array }

  zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)
      })
    }

    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function(dom, selector) {
    dom = dom || []
    dom.__proto__ = $.fn
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    var dom
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
    return (isDocument(element) && isSimple && maybeID) ?
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      slice.call(
        isSimple && !maybeID ?
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this
      if (!selector) result = $()
      else if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },
    closest: function(selector, context){
      var node = this[0], collection = false
      if (typeof selector == 'object') collection = $(selector)
      while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
        node = node !== context && !isDocument(node) && node.parentNode
      return $(node)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '')
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this[0].textContent : null)
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
        (!this.length || this[0].nodeType !== 1 ? undefined :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
        setAttribute(this, attribute)
      }, this)})
    },
    prop: function(name, value){
      name = propMap[name] || name
      return (1 in arguments) ?
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        }) :
        (this[0] && this[0][name])
    },
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      return 0 in arguments ?
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        }) :
        (this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
        )
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (!this.length) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2) {
        var computedStyle, element = this[0]
        if(!element) return
        computedStyle = getComputedStyle(element, '')
        if (typeof property == 'string')
          return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
        else if (isArray(property)) {
          var props = {}
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value } :
        function(){ this.scrollTo(this.scrollX, value) })
    },
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        function(){ this.scrollTo(value, this.scrollY) })
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() })

    $.fn[dimension] = function(value){
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            argType = type(arg)
            return argType == "object" || argType == "array" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target)
          if (parentInDocument) traverseNode(node, function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src)
              window['eval'].call(window, el.innerHTML)
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = delegator
      var callback  = delegator || fn
      handler.proxy = function(e){
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function(){
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (isFunction(data) || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  $.fn.off = function(event, selector, callback){
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // handle focus(), blur() by calling them directly
      if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout focus blur load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return (0 in arguments) ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }

})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var jsonpID = 0,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a')

  originAnchor.href = window.location.href

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.isDefaultPrevented()
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options, deferred){
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function(errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort }, abortTimeout

    if (deferred) deferred.promise(xhr)

    $(script).on('load error', function(e, errorType){
      clearTimeout(abortTimeout)
      $(script).off().remove()

      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }

      window[callbackName] = originalCallback
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0])

      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function(){
      responseData = arguments
    }

    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    document.head.appendChild(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    if (query == '') return url
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data), options.data = undefined
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred(),
        urlAnchor
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) {
      urlAnchor = document.createElement('a')
      urlAnchor.href = settings.url
      urlAnchor.href = urlAnchor.href
      settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
    }

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)

    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (hasPlaceholder) dataType = 'jsonp'

    if (settings.cache === false || (
         (!options || options.cache !== true) &&
         ('script' == dataType || 'jsonp' == dataType)
        ))
      settings.url = appendQuery(settings.url, '_=' + Date.now())

    if ('jsonp' == dataType) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = { },
        setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

    if (deferred) deferred.promise(xhr)

    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    setHeader('Accept', mime || '*/*')
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    xhr.setRequestHeader = setHeader

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings, deferred)
          else ajaxSuccess(result, xhr, settings, deferred)
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)

    for (name in headers) nativeSetHeader.apply(xhr, headers[name])

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) dataType = success, success = data, data = undefined
    if (!$.isFunction(success)) dataType = success, success = undefined
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }

  $.get = function(/* url, data, success, dataType */){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(/* url, data, success, dataType */){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(/* url, data, success */){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(key, value) {
      if ($.isFunction(value)) value = value()
      if (value == null) value = ""
      this.push(escape(key) + '=' + escape(value))
    }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  // __proto__ doesn't exist on IE<11, so redefine
  // the Z function to use object extension instead
  if (!('__proto__' in {})) {
    $.extend($.zepto, {
      Z: function(dom, selector){
        dom = dom || []
        $.extend(dom, $.fn)
        dom.selector = selector || ''
        dom.__Z = true
        return dom
      },
      // this is a kludge but works
      isZ: function(object){
        return $.type(object) === 'array' && '__Z' in object
      }
    })
  }

  // getComputedStyle shouldn't freak out when called
  // without a valid element as argument
  try {
    getComputedStyle(undefined)
  } catch(e) {
    var nativeGetComputedStyle = getComputedStyle;
    window.getComputedStyle = function(element){
      try {
        return nativeGetComputedStyle(element)
      } catch(e) {
        return null
      }
    }
  }
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  function detect(ua, platform){
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/),
      android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
      osx = !!ua.match(/\(Macintosh\; Intel /),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      win = /Win\d{2}|Windows/.test(platform),
      wp = ua.match(/Windows Phone ([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
      bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
      rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
      playbook = ua.match(/PlayBook/),
      chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
      firefox = ua.match(/Firefox\/([\d.]+)/),
      ie = ua.match(/MSIE\s([\d.]+)/) || ua.match(/Trident\/[\d](?=[^\?]+).*rv:([0-9.].)/),
      webview = !chrome && ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/),
      safari = webview || ua.match(/Version\/([\d.]+)([^S](Safari)|[^M]*(Mobile)[^S]*(Safari))/)

    // Todo: clean this up with a better OS/browser seperation:
    // - discern (more) between multiple browsers on android
    // - decide if kindle fire in silk mode is android or not
    // - Firefox on Android doesn't specify the Android version
    // - possibly devide in os, device and browser hashes

    if (browser.webkit = !!webkit) browser.version = webkit[1]

    if (android) os.android = true, os.version = android[2]
    if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
    if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
    if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null
    if (wp) os.wp = true, os.version = wp[1]
    if (webos) os.webos = true, os.version = webos[2]
    if (touchpad) os.touchpad = true
    if (blackberry) os.blackberry = true, os.version = blackberry[2]
    if (bb10) os.bb10 = true, os.version = bb10[2]
    if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2]
    if (playbook) browser.playbook = true
    if (kindle) os.kindle = true, os.version = kindle[1]
    if (silk) browser.silk = true, browser.version = silk[1]
    if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
    if (chrome) browser.chrome = true, browser.version = chrome[1]
    if (firefox) browser.firefox = true, browser.version = firefox[1]
    if (ie) browser.ie = true, browser.version = ie[1]
    if (safari && (osx || os.ios || win)) {
      browser.safari = true
      if (!os.ios) browser.version = safari[1]
    }
    if (webview) browser.webview = true

    os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) ||
      (firefox && ua.match(/Tablet/)) || (ie && !ua.match(/Phone/) && ua.match(/Touch/)))
    os.phone  = !!(!os.tablet && !os.ipod && (android || iphone || webos || blackberry || bb10 ||
      (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) ||
      (firefox && ua.match(/Mobile/)) || (ie && ua.match(/Touch/))))
  }

  detect.call($, navigator.userAgent, navigator.platform)
  // make available to unit tests
  $.__detect = detect

})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($, undefined){
  var prefix = '', eventPrefix, endEventName, endAnimationName,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
    document = window.document, testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    transform,
    transitionProperty, transitionDuration, transitionTiming, transitionDelay,
    animationName, animationDuration, animationTiming, animationDelay,
    cssReset = {}

  function dasherize(str) { return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : name.toLowerCase() }

  $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + vendor.toLowerCase() + '-'
      eventPrefix = event
      return false
    }
  })

  transform = prefix + 'transform'
  cssReset[transitionProperty = prefix + 'transition-property'] =
  cssReset[transitionDuration = prefix + 'transition-duration'] =
  cssReset[transitionDelay    = prefix + 'transition-delay'] =
  cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
  cssReset[animationName      = prefix + 'animation-name'] =
  cssReset[animationDuration  = prefix + 'animation-duration'] =
  cssReset[animationDelay     = prefix + 'animation-delay'] =
  cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    speeds: { _default: 400, fast: 200, slow: 600 },
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function(properties, duration, ease, callback, delay){
    if ($.isFunction(duration))
      callback = duration, ease = undefined, duration = undefined
    if ($.isFunction(ease))
      callback = ease, ease = undefined
    if ($.isPlainObject(duration))
      ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration
    if (duration) duration = (typeof duration == 'number' ? duration :
                    ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
    if (delay) delay = parseFloat(delay) / 1000
    return this.anim(properties, duration, ease, callback, delay)
  }

  $.fn.anim = function(properties, duration, ease, callback, delay){
    var key, cssValues = {}, cssProperties, transforms = '',
        that = this, wrappedCallback, endEvent = $.fx.transitionEnd,
        fired = false

    if (duration === undefined) duration = $.fx.speeds._default / 1000
    if (delay === undefined) delay = 0
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssValues[animationName] = properties
      cssValues[animationDuration] = duration + 's'
      cssValues[animationDelay] = delay + 's'
      cssValues[animationTiming] = (ease || 'linear')
      endEvent = $.fx.animationEnd
    } else {
      cssProperties = []
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
        else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

      if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
      if (duration > 0 && typeof properties === 'object') {
        cssValues[transitionProperty] = cssProperties.join(', ')
        cssValues[transitionDuration] = duration + 's'
        cssValues[transitionDelay] = delay + 's'
        cssValues[transitionTiming] = (ease || 'linear')
      }
    }

    wrappedCallback = function(event){
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, wrappedCallback)
      } else
        $(this).unbind(endEvent, wrappedCallback) // triggered by setTimeout

      fired = true
      $(this).css(cssReset)
      callback && callback.call(this)
    }
    if (duration > 0){
      this.bind(endEvent, wrappedCallback)
      // transitionEnd is not always firing on older Android phones
      // so make sure it gets fired
      setTimeout(function(){
        if (fired) return
        wrappedCallback.call(that)
      }, ((duration + delay) * 1000) + 25)
    }

    // trigger page reflow so new elements can animate
    this.size() && this.get(0).clientLeft

    this.css(cssValues)

    if (duration <= 0) setTimeout(function() {
      that.each(function(){ wrappedCallback.call(this) })
    }, 0)

    return this
  }

  testEl = null
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.
//
//     Some code (c) 2005, 2013 jQuery Foundation, Inc. and other contributors

;(function($){
  var slice = Array.prototype.slice

  function Deferred(func) {
    var tuples = [
          // action, add listener, listener list, final state
          [ "resolve", "done", $.Callbacks({once:1, memory:1}), "resolved" ],
          [ "reject", "fail", $.Callbacks({once:1, memory:1}), "rejected" ],
          [ "notify", "progress", $.Callbacks({memory:1}) ]
        ],
        state = "pending",
        promise = {
          state: function() {
            return state
          },
          always: function() {
            deferred.done(arguments).fail(arguments)
            return this
          },
          then: function(/* fnDone [, fnFailed [, fnProgress]] */) {
            var fns = arguments
            return Deferred(function(defer){
              $.each(tuples, function(i, tuple){
                var fn = $.isFunction(fns[i]) && fns[i]
                deferred[tuple[1]](function(){
                  var returned = fn && fn.apply(this, arguments)
                  if (returned && $.isFunction(returned.promise)) {
                    returned.promise()
                      .done(defer.resolve)
                      .fail(defer.reject)
                      .progress(defer.notify)
                  } else {
                    var context = this === promise ? defer.promise() : this,
                        values = fn ? [returned] : arguments
                    defer[tuple[0] + "With"](context, values)
                  }
                })
              })
              fns = null
            }).promise()
          },

          promise: function(obj) {
            return obj != null ? $.extend( obj, promise ) : promise
          }
        },
        deferred = {}

    $.each(tuples, function(i, tuple){
      var list = tuple[2],
          stateString = tuple[3]

      promise[tuple[1]] = list.add

      if (stateString) {
        list.add(function(){
          state = stateString
        }, tuples[i^1][2].disable, tuples[2][2].lock)
      }

      deferred[tuple[0]] = function(){
        deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments)
        return this
      }
      deferred[tuple[0] + "With"] = list.fireWith
    })

    promise.promise(deferred)
    if (func) func.call(deferred, deferred)
    return deferred
  }

  $.when = function(sub) {
    var resolveValues = slice.call(arguments),
        len = resolveValues.length,
        i = 0,
        remain = len !== 1 || (sub && $.isFunction(sub.promise)) ? len : 0,
        deferred = remain === 1 ? sub : Deferred(),
        progressValues, progressContexts, resolveContexts,
        updateFn = function(i, ctx, val){
          return function(value){
            ctx[i] = this
            val[i] = arguments.length > 1 ? slice.call(arguments) : value
            if (val === progressValues) {
              deferred.notifyWith(ctx, val)
            } else if (!(--remain)) {
              deferred.resolveWith(ctx, val)
            }
          }
        }

    if (len > 1) {
      progressValues = new Array(len)
      progressContexts = new Array(len)
      resolveContexts = new Array(len)
      for ( ; i < len; ++i ) {
        if (resolveValues[i] && $.isFunction(resolveValues[i].promise)) {
          resolveValues[i].promise()
            .done(updateFn(i, resolveContexts, resolveValues))
            .fail(deferred.reject)
            .progress(updateFn(i, progressContexts, progressValues))
        } else {
          --remain
        }
      }
    }
    if (!remain) deferred.resolveWith(resolveContexts, resolveValues)
    return deferred.promise()
  }

  $.Deferred = Deferred
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  // Create a collection of callbacks to be fired in a sequence, with configurable behaviour
  // Option flags:
  //   - once: Callbacks fired at most one time.
  //   - memory: Remember the most recent context and arguments
  //   - stopOnFalse: Cease iterating over callback list
  //   - unique: Permit adding at most one instance of the same callback
  $.Callbacks = function(options) {
    options = $.extend({}, options)

    var memory, // Last fire value (for non-forgettable lists)
        fired,  // Flag to know if list was already fired
        firing, // Flag to know if list is currently firing
        firingStart, // First callback to fire (used internally by add and fireWith)
        firingLength, // End of the loop when firing
        firingIndex, // Index of currently firing callback (modified by remove if needed)
        list = [], // Actual callback list
        stack = !options.once && [], // Stack of fire calls for repeatable lists
        fire = function(data) {
          memory = options.memory && data
          fired = true
          firingIndex = firingStart || 0
          firingStart = 0
          firingLength = list.length
          firing = true
          for ( ; list && firingIndex < firingLength ; ++firingIndex ) {
            if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
              memory = false
              break
            }
          }
          firing = false
          if (list) {
            if (stack) stack.length && fire(stack.shift())
            else if (memory) list.length = 0
            else Callbacks.disable()
          }
        },

        Callbacks = {
          add: function() {
            if (list) {
              var start = list.length,
                  add = function(args) {
                    $.each(args, function(_, arg){
                      if (typeof arg === "function") {
                        if (!options.unique || !Callbacks.has(arg)) list.push(arg)
                      }
                      else if (arg && arg.length && typeof arg !== 'string') add(arg)
                    })
                  }
              add(arguments)
              if (firing) firingLength = list.length
              else if (memory) {
                firingStart = start
                fire(memory)
              }
            }
            return this
          },
          remove: function() {
            if (list) {
              $.each(arguments, function(_, arg){
                var index
                while ((index = $.inArray(arg, list, index)) > -1) {
                  list.splice(index, 1)
                  // Handle firing indexes
                  if (firing) {
                    if (index <= firingLength) --firingLength
                    if (index <= firingIndex) --firingIndex
                  }
                }
              })
            }
            return this
          },
          has: function(fn) {
            return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length))
          },
          empty: function() {
            firingLength = list.length = 0
            return this
          },
          disable: function() {
            list = stack = memory = undefined
            return this
          },
          disabled: function() {
            return !list
          },
          lock: function() {
            stack = undefined;
            if (!memory) Callbacks.disable()
            return this
          },
          locked: function() {
            return !stack
          },
          fireWith: function(context, args) {
            if (list && (!fired || stack)) {
              args = args || []
              args = [context, args.slice ? args.slice() : args]
              if (firing) stack.push(args)
              else fire(args)
            }
            return this
          },
          fire: function() {
            return Callbacks.fireWith(this, arguments)
          },
          fired: function() {
            return !!fired
          }
        }

    return Callbacks
  }
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var touch = {},
    touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
    longTapDelay = 750,
    gesture

  function swipeDirection(x1, x2, y1, y2) {
    return Math.abs(x1 - x2) >=
      Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
  }

  function longTap() {
    longTapTimeout = null
    if (touch.last) {
      touch.el.trigger('longTap')
      touch = {}
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout)
    longTapTimeout = null
  }

  function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout)
    if (tapTimeout) clearTimeout(tapTimeout)
    if (swipeTimeout) clearTimeout(swipeTimeout)
    if (longTapTimeout) clearTimeout(longTapTimeout)
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
    touch = {}
  }

  function isPrimaryTouch(event){
    return (event.pointerType == 'touch' ||
      event.pointerType == event.MSPOINTER_TYPE_TOUCH)
      && event.isPrimary
  }

  function isPointerEventType(e, type){
    return (e.type == 'pointer'+type ||
      e.type.toLowerCase() == 'mspointer'+type)
  }

  $(document).ready(function(){
    var now, delta, deltaX = 0, deltaY = 0, firstTouch, _isPointerType

    if ('MSGesture' in window) {
      gesture = new MSGesture()
      gesture.target = document.body
    }

    $(document)
      .bind('MSGestureEnd', function(e){
        var swipeDirectionFromVelocity =
          e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null;
        if (swipeDirectionFromVelocity) {
          touch.el.trigger('swipe')
          touch.el.trigger('swipe'+ swipeDirectionFromVelocity)
        }
      })
      .on('touchstart MSPointerDown pointerdown', function(e){
        if((_isPointerType = isPointerEventType(e, 'down')) &&
          !isPrimaryTouch(e)) return
        firstTouch = _isPointerType ? e : e.touches[0]
        if (e.touches && e.touches.length === 1 && touch.x2) {
          // Clear out touch movement data if we have it sticking around
          // This can occur if touchcancel doesn't fire due to preventDefault, etc.
          touch.x2 = undefined
          touch.y2 = undefined
        }
        now = Date.now()
        delta = now - (touch.last || now)
        touch.el = $('tagName' in firstTouch.target ?
          firstTouch.target : firstTouch.target.parentNode)
        touchTimeout && clearTimeout(touchTimeout)
        touch.x1 = firstTouch.pageX
        touch.y1 = firstTouch.pageY
        if (delta > 0 && delta <= 250) touch.isDoubleTap = true
        touch.last = now
        longTapTimeout = setTimeout(longTap, longTapDelay)
        // adds the current touch contact for IE gesture recognition
        if (gesture && _isPointerType) gesture.addPointer(e.pointerId);
      })
      .on('touchmove MSPointerMove pointermove', function(e){
        if((_isPointerType = isPointerEventType(e, 'move')) &&
          !isPrimaryTouch(e)) return
        firstTouch = _isPointerType ? e : e.touches[0]
        cancelLongTap()
        touch.x2 = firstTouch.pageX
        touch.y2 = firstTouch.pageY

        deltaX += Math.abs(touch.x1 - touch.x2)
        deltaY += Math.abs(touch.y1 - touch.y2)
      })
      .on('touchend MSPointerUp pointerup', function(e){
        if((_isPointerType = isPointerEventType(e, 'up')) &&
          !isPrimaryTouch(e)) return
        cancelLongTap()

        // swipe
        if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
            (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

          swipeTimeout = setTimeout(function() {
            touch.el.trigger('swipe')
            touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
            touch = {}
          }, 0)

        // normal tap
        else if ('last' in touch)
          // don't fire tap when delta position changed by more than 30 pixels,
          // for instance when moving to a point and back to origin
          if (deltaX < 30 && deltaY < 30) {
            // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
            // ('tap' fires before 'scroll')
            tapTimeout = setTimeout(function() {

              // trigger universal 'tap' with the option to cancelTouch()
              // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
              var event = $.Event('tap')
              event.cancelTouch = cancelAll
              touch.el.trigger(event)

              // trigger double tap immediately
              if (touch.isDoubleTap) {
                if (touch.el) touch.el.trigger('doubleTap')
                touch = {}
              }

              // trigger single tap after 250ms of inactivity
              else {
                touchTimeout = setTimeout(function(){
                  touchTimeout = null
                  if (touch.el) touch.el.trigger('singleTap')
                  touch = {}
                }, 250)
              }
            }, 0)
          } else {
            touch = {}
          }
          deltaX = deltaY = 0

      })
      // when the browser window loses focus,
      // for example when a modal dialog is shown,
      // cancel all ongoing events
      .on('touchcancel MSPointerCancel pointercancel', cancelAll)

    // scrolling the window indicates intention of the user
    // to scroll, not tap or swipe, so cancel all ongoing events
    $(window).on('scroll', cancelAll)
  })

  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
    'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(eventName){
    $.fn[eventName] = function(callback){ return this.on(eventName, callback) }
  })
})(Zepto)

//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  if ($.os.ios) {
    var gesture = {}, gestureTimeout

    function parentIfText(node){
      return 'tagName' in node ? node : node.parentNode
    }

    $(document).bind('gesturestart', function(e){
      var now = Date.now(), delta = now - (gesture.last || now)
      gesture.target = parentIfText(e.target)
      gestureTimeout && clearTimeout(gestureTimeout)
      gesture.e1 = e.scale
      gesture.last = now
    }).bind('gesturechange', function(e){
      gesture.e2 = e.scale
    }).bind('gestureend', function(e){
      if (gesture.e2 > 0) {
        Math.abs(gesture.e1 - gesture.e2) != 0 && $(gesture.target).trigger('pinch') &&
          $(gesture.target).trigger('pinch' + (gesture.e1 - gesture.e2 > 0 ? 'In' : 'Out'))
        gesture.e1 = gesture.e2 = gesture.last = 0
      } else if ('last' in gesture) {
        gesture = {}
      }
    })

    ;['pinch', 'pinchIn', 'pinchOut'].forEach(function(m){
      $.fn[m] = function(callback){ return this.bind(m, callback) }
    })
  }
})(Zepto)
;
define("jquery", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Zepto;
    };
}(this)));

!function(a){function b(){return""===i.hash||"#"===i.hash}function c(a,b){for(var c=0;c<a.length;c+=1)if(b(a[c],c,a)===!1)return}function d(a){for(var b=[],c=0,d=a.length;d>c;c++)b=b.concat(a[c]);return b}function e(a,b,c){if(!a.length)return c();var d=0;!function e(){b(a[d],function(b){b||b===!1?(c(b),c=function(){}):(d+=1,d===a.length?c():e())})}()}function f(a,b,c){c=a;for(var d in b)if(b.hasOwnProperty(d)&&(c=b[d](a),c!==a))break;return c===a?"([._a-zA-Z0-9-%()]+)":c}function g(a,b){for(var c,d=0,e="";c=a.substr(d).match(/[^\w\d\- %@&]*\*[^\w\d\- %@&]*/);)d=c.index+c[0].length,c[0]=c[0].replace(/^\*/,"([_.()!\\ %@&a-zA-Z0-9-]+)"),e+=a.substr(0,c.index)+c[0];a=e+=a.substr(d);var g,h,i=a.match(/:([^\/]+)/gi);if(i){h=i.length;for(var j=0;h>j;j++)g=i[j],a="::"===g.slice(0,2)?g.slice(1):a.replace(g,f(g,b))}return a}function h(a,b,c,d){var e,f=0,g=0,h=0,c=(c||"(").toString(),d=(d||")").toString();for(e=0;e<a.length;e++){var i=a[e];if(i.indexOf(c,f)>i.indexOf(d,f)||~i.indexOf(c,f)&&!~i.indexOf(d,f)||!~i.indexOf(c,f)&&~i.indexOf(d,f)){if(g=i.indexOf(c,f),h=i.indexOf(d,f),~g&&!~h||!~g&&~h){var j=a.slice(0,(e||1)+1).join(b);a=[j].concat(a.slice((e||1)+1))}f=(h>g?h:g)+1,e=0}else f=0}return a}var i=document.location,j={mode:"modern",hash:i.hash,history:!1,check:function(){var a=i.hash;a!=this.hash&&(this.hash=a,this.onHashChanged())},fire:function(){"modern"===this.mode?this.history===!0?window.onpopstate():window.onhashchange():this.onHashChanged()},init:function(a,b){function c(a){for(var b=0,c=k.listeners.length;c>b;b++)k.listeners[b](a)}var d=this;if(this.history=b,k.listeners||(k.listeners=[]),"onhashchange"in window&&(void 0===document.documentMode||document.documentMode>7))this.history===!0?setTimeout(function(){window.onpopstate=c},500):window.onhashchange=c,this.mode="modern";else{var e=document.createElement("iframe");e.id="state-frame",e.style.display="none",document.body.appendChild(e),this.writeFrame(""),"onpropertychange"in document&&"attachEvent"in document&&document.attachEvent("onpropertychange",function(){"location"===event.propertyName&&d.check()}),window.setInterval(function(){d.check()},50),this.onHashChanged=c,this.mode="legacy"}return k.listeners.push(a),this.mode},destroy:function(a){if(k&&k.listeners)for(var b=k.listeners,c=b.length-1;c>=0;c--)b[c]===a&&b.splice(c,1)},setHash:function(a){return"legacy"===this.mode&&this.writeFrame(a),this.history===!0?(window.history.pushState({},document.title,a),this.fire()):i.hash="/"===a[0]?a:"/"+a,this},writeFrame:function(a){var b=document.getElementById("state-frame"),c=b.contentDocument||b.contentWindow.document;c.open(),c.write("<script>_hash = '"+a+"'; onload = parent.listener.syncHash;<script>"),c.close()},syncHash:function(){var a=this._hash;return a!=i.hash&&(i.hash=a),this},onHashChanged:function(){}},k=a.Router=function(a){return this instanceof k?(this.params={},this.routes={},this.methods=["on","once","after","before"],this.scope=[],this._methods={},this._insert=this.insert,this.insert=this.insertEx,this.historySupport=null!=(null!=window.history?window.history.pushState:null),this.configure(),void this.mount(a||{})):new k(a)};k.prototype.init=function(a){var c,d=this;return this.handler=function(a){var b=a&&a.newURL||window.location.hash,c=d.history===!0?d.getPath():b.replace(/.*#/,"");d.dispatch("on","/"===c.charAt(0)?c:"/"+c)},j.init(this.handler,this.history),this.history===!1?b()&&a?i.hash=a:b()||d.dispatch("on","/"+i.hash.replace(/^(#\/|#|\/)/,"")):(this.convert_hash_in_init?(c=b()&&a?a:b()?null:i.hash.replace(/^#/,""),c&&window.history.replaceState({},document.title,c)):c=this.getPath(),(c||this.run_in_init===!0)&&this.handler()),this},k.prototype.explode=function(){var a=this.history===!0?this.getPath():i.hash;return"/"===a.charAt(1)&&(a=a.slice(1)),a.slice(1,a.length).split("/")},k.prototype.setRoute=function(a,b,c){var d=this.explode();return"number"==typeof a&&"string"==typeof b?d[a]=b:"string"==typeof c?d.splice(a,b,s):d=[a],j.setHash(d.join("/")),d},k.prototype.insertEx=function(a,b,c,d){return"once"===a&&(a="on",c=function(a){var b=!1;return function(){return b?void 0:(b=!0,a.apply(this,arguments))}}(c)),this._insert(a,b,c,d)},k.prototype.getRoute=function(a){var b=a;if("number"==typeof a)b=this.explode()[a];else if("string"==typeof a){var c=this.explode();b=c.indexOf(a)}else b=this.explode();return b},k.prototype.destroy=function(){return j.destroy(this.handler),this},k.prototype.getPath=function(){var a=window.location.pathname;return"/"!==a.substr(0,1)&&(a="/"+a),a};var l=/\?.*/;k.prototype.configure=function(a){a=a||{};for(var b=0;b<this.methods.length;b++)this._methods[this.methods[b]]=!0;return this.recurse=a.recurse||this.recurse||!1,this.async=a.async||!1,this.delimiter=a.delimiter||"/",this.strict="undefined"==typeof a.strict?!0:a.strict,this.notfound=a.notfound,this.resource=a.resource,this.history=a.html5history&&this.historySupport||!1,this.run_in_init=this.history===!0&&a.run_handler_in_init!==!1,this.convert_hash_in_init=this.history===!0&&a.convert_hash_in_init!==!1,this.every={after:a.after||null,before:a.before||null,on:a.on||null},this},k.prototype.param=function(a,b){":"!==a[0]&&(a=":"+a);var c=new RegExp(a,"g");return this.params[a]=function(a){return a.replace(c,b.source||b)},this},k.prototype.on=k.prototype.route=function(a,b,c){var d=this;return c||"function"!=typeof b||(c=b,b=a,a="on"),Array.isArray(b)?b.forEach(function(b){d.on(a,b,c)}):(b.source&&(b=b.source.replace(/\\\//gi,"/")),Array.isArray(a)?a.forEach(function(a){d.on(a.toLowerCase(),b,c)}):(b=b.split(new RegExp(this.delimiter)),b=h(b,this.delimiter),void this.insert(a,this.scope.concat(b),c)))},k.prototype.path=function(a,b){var c=this.scope.length;a.source&&(a=a.source.replace(/\\\//gi,"/")),a=a.split(new RegExp(this.delimiter)),a=h(a,this.delimiter),this.scope=this.scope.concat(a),b.call(this,this),this.scope.splice(c,a.length)},k.prototype.dispatch=function(a,b,c){function d(){f.last=g.after,f.invoke(f.runlist(g),f,c)}var e,f=this,g=this.traverse(a,b.replace(l,""),this.routes,""),h=this._invoked;return this._invoked=!0,g&&0!==g.length?("forward"===this.recurse&&(g=g.reverse()),e=this.every&&this.every.after?[this.every.after].concat(this.last):[this.last],e&&e.length>0&&h?(this.async?this.invoke(e,this,d):(this.invoke(e,this),d()),!0):(d(),!0)):(this.last=[],"function"==typeof this.notfound&&this.invoke([this.notfound],{method:a,path:b},c),!1)},k.prototype.invoke=function(a,b,d){var f,g=this;this.async?(f=function(c,d){return Array.isArray(c)?e(c,f,d):void("function"==typeof c&&c.apply(b,(a.captures||[]).concat(d)))},e(a,f,function(){d&&d.apply(b,arguments)})):(f=function(d){return Array.isArray(d)?c(d,f):"function"==typeof d?d.apply(b,a.captures||[]):void("string"==typeof d&&g.resource&&g.resource[d].apply(b,a.captures||[]))},c(a,f))},k.prototype.traverse=function(a,b,c,d,e){function f(a){function b(a){for(var c=[],d=0;d<a.length;d++)c[d]=Array.isArray(a[d])?b(a[d]):a[d];return c}function c(a){for(var b=a.length-1;b>=0;b--)Array.isArray(a[b])?(c(a[b]),0===a[b].length&&a.splice(b,1)):e(a[b])||a.splice(b,1)}if(!e)return a;var d=b(a);return d.matched=a.matched,d.captures=a.captures,d.after=a.after.filter(e),c(d),d}var g,h,i,j,k=[];if(b===this.delimiter&&c[a])return j=[[c.before,c[a]].filter(Boolean)],j.after=[c.after].filter(Boolean),j.matched=!0,j.captures=[],f(j);for(var l in c)if(c.hasOwnProperty(l)&&(!this._methods[l]||this._methods[l]&&"object"==typeof c[l]&&!Array.isArray(c[l]))){if(g=h=d+this.delimiter+l,this.strict||(h+="["+this.delimiter+"]?"),i=b.match(new RegExp("^"+h)),!i)continue;if(i[0]&&i[0]==b&&c[l][a])return j=[[c[l].before,c[l][a]].filter(Boolean)],j.after=[c[l].after].filter(Boolean),j.matched=!0,j.captures=i.slice(1),this.recurse&&c===this.routes&&(j.push([c.before,c.on].filter(Boolean)),j.after=j.after.concat([c.after].filter(Boolean))),f(j);if(j=this.traverse(a,b,c[l],g),j.matched)return j.length>0&&(k=k.concat(j)),this.recurse&&(k.push([c[l].before,c[l].on].filter(Boolean)),j.after=j.after.concat([c[l].after].filter(Boolean)),c===this.routes&&(k.push([c.before,c.on].filter(Boolean)),j.after=j.after.concat([c.after].filter(Boolean)))),k.matched=!0,k.captures=j.captures,k.after=j.after,f(k)}return!1},k.prototype.insert=function(a,b,c,d){var e,f,h,i,j;if(b=b.filter(function(a){return a&&a.length>0}),d=d||this.routes,j=b.shift(),/\:|\*/.test(j)&&!/\\d|\\w/.test(j)&&(j=g(j,this.params)),b.length>0)return d[j]=d[j]||{},this.insert(a,b,c,d[j]);if(j||b.length||d!==this.routes){if(f=typeof d[j],h=Array.isArray(d[j]),d[j]&&!h&&"object"==f)switch(e=typeof d[j][a]){case"function":return void(d[j][a]=[d[j][a],c]);case"object":return void d[j][a].push(c);case"undefined":return void(d[j][a]=c)}else if("undefined"==f)return i={},i[a]=c,void(d[j]=i);throw new Error("Invalid route context: "+f)}switch(e=typeof d[a]){case"function":return void(d[a]=[d[a],c]);case"object":return void d[a].push(c);case"undefined":return void(d[a]=c)}},k.prototype.extend=function(a){function b(a){d._methods[a]=!0,d[a]=function(){var b=1===arguments.length?[a,""]:[a];d.on.apply(d,b.concat(Array.prototype.slice.call(arguments)))}}var c,d=this,e=a.length;for(c=0;e>c;c++)b(a[c])},k.prototype.runlist=function(a){var b=this.every&&this.every.before?[this.every.before].concat(d(a)):d(a);return this.every&&this.every.on&&b.push(this.every.on),b.captures=a.captures,b.source=a.source,b},k.prototype.mount=function(a,b){function c(b,c){var e=b,f=b.split(d.delimiter),g=typeof a[b],i=""===f[0]||!d._methods[f[0]],j=i?"on":e;return i&&(e=e.slice((e.match(new RegExp("^"+d.delimiter))||[""])[0].length),f.shift()),i&&"object"===g&&!Array.isArray(a[b])?(c=c.concat(f),void d.mount(a[b],c)):(i&&(c=c.concat(e.split(d.delimiter)),c=h(c,d.delimiter)),void d.insert(j,c,a[b]))}if(a&&"object"==typeof a&&!Array.isArray(a)){var d=this;b=b||[],Array.isArray(b)||(b=b.split(d.delimiter));for(var e in a)a.hasOwnProperty(e)&&c(e,b.slice(0))}}}("object"==typeof exports?exports:window);
define("director", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Router;
    };
}(this)));

function EventEmitter(){this._events={}}var isArray=Array.isArray;EventEmitter.prototype.addListener=function(a,b,c,d){if("function"!=typeof b)throw new Error("addListener only takes instances of Function");return this.emit("newListener",a,"function"==typeof b.listener?b.listener:b),this._events[a]?isArray(this._events[a])?this._events[a].push(b):this._events[a]=[this._events[a],b]:this._events[a]=b,this},EventEmitter.prototype.on=EventEmitter.prototype.addListener,EventEmitter.prototype.once=function(a,b,c){function d(){e.removeListener(a,d),b.apply(this,arguments)}if("function"!=typeof b)throw new Error(".once only takes instances of Function");var e=this;return d.listener=b,e.on(a,d),this},EventEmitter.prototype.removeListener=function(a,b,c){if("function"!=typeof b)throw new Error("removeListener only takes instances of Function");if(!this._events[a])return this;var d=this._events[a];if(isArray(d)){for(var e=-1,f=0,g=d.length;g>f;f++)if(d[f]===b||d[f].listener&&d[f].listener===b){e=f;break}if(0>e)return this;d.splice(e,1),0==d.length&&delete this._events[a]}else(d===b||d.listener&&d.listener===b)&&delete this._events[a];return this},EventEmitter.prototype.off=EventEmitter.prototype.removeListener,EventEmitter.prototype.removeAllListeners=function(a){return 0===arguments.length?(this._events={},this):(a&&this._events&&this._events[a]&&(this._events[a]=null),this)},EventEmitter.prototype.listeners=function(a){return this._events[a]||(this._events[a]=[]),isArray(this._events[a])||(this._events[a]=[this._events[a]]),this._events[a]},EventEmitter.prototype.emit=function(a){var a=arguments[0],b=this._events[a];if(!b)return!1;if("function"==typeof b){switch(arguments.length){case 1:b.call(this);break;case 2:b.call(this,arguments[1]);break;case 3:b.call(this,arguments[1],arguments[2]);break;default:for(var c=arguments.length,d=new Array(c-1),e=1;c>e;e++)d[e-1]=arguments[e];b.apply(this,d)}return!0}if(isArray(b)){for(var c=arguments.length,d=new Array(c-1),e=1;c>e;e++)d[e-1]=arguments[e];for(var f=b.slice(),e=0,c=f.length;c>e;e++)f[e].apply(this,d);return!0}return!1};
define("EventEmitter", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.EventEmitter;
    };
}(this)));

(function() {
  define('providers/data',['jquery'], function($) {
    var ajax, categories, dict, exports, get, getCategories, getJSON, getPost, getPosts, getSettings, getVersion, posts, settings, version;
    version = 0;
    settings = 0;
    categories = null;
    posts = [];
    dict = {};
    ajax = function(method, url, check, callback) {
      var checked, defer;
      defer = $.Deferred();
      if (url) {
        checked = check();
        if (checked) {
          defer.resolve(checked);
        } else {
          $[method](url).then(function(data) {
            var result;
            result = callback(data);
            return defer.resolve(result);
          }).fail(function(err) {
            return defer.reject(err);
          });
        }
      } else {
        defer.resolve('');
      }
      return defer.promise();
    };
    get = function(url, check, callback) {
      return ajax('get', url, check, callback);
    };
    getJSON = function(url, check, callback) {
      return ajax('getJSON', url, check, callback);
    };
    getVersion = function() {
      var callback, check;
      check = function() {
        if (version) {
          return version;
        } else {
          return false;
        }
      };
      callback = function(data) {
        var date;
        date = new Date(data.lastModified);
        version = date.getTime() / 1e3;
        return version;
      };
      return get('./CNAME', check, callback);
    };
    getSettings = function() {
      var callback, check;
      check = function() {
        if (settings) {
          return settings;
        } else {
          return false;
        }
      };
      callback = function(data) {
        settings = data;
        return settings;
      };
      return getJSON('./settings.json', check, callback);
    };
    getCategories = function() {
      var callback, check;
      check = function() {
        if (categories) {
          return categories;
        } else {
          return false;
        }
      };
      callback = function(data) {
        var cate, copy, _i, _len;
        copy = function(src, dest) {
          var item, key, val, _i, _len, _results;
          _results = [];
          for (key in src) {
            val = src[key];
            if (src.hasOwnProperty(key)) {
              if (key === 'categories') {
                dict = {};
                for (_i = 0, _len = val.length; _i < _len; _i++) {
                  item = val[_i];
                  if (item.name) {
                    dict[item.name] = item;
                  }
                }
                _results.push(dest[key] = dict);
              } else {
                _results.push(dest[key] = val);
              }
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        };
        if (data && data.length) {
          categories = {};
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            cate = data[_i];
            if (cate.name) {
              categories[cate.name] = {};
              copy(cate, categories[cate.name]);
            }
          }
        }
        return categories;
      };
      return getJSON('./categories.json', check, callback);
    };
    getPosts = function() {
      var callback, check;
      check = function() {
        if (posts && posts.length) {
          return posts;
        } else {
          return false;
        }
      };
      callback = function(data) {
        var post, push, _i, _len;
        push = function(item) {
          var arr;
          arr = item.link.split('/');
          item.filename = arr.pop();
          return posts.push(item);
        };
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          post = data[_i];
          if (post.link.length) {
            push(post);
          }
        }
        return posts;
      };
      return getJSON('./posts.json', check, callback);
    };
    getPost = function(link) {
      var callback, check;
      check = function() {
        if (dict.hasOwnProperty(link)) {
          return dict[link];
        } else {
          return false;
        }
      };
      callback = function(data) {
        dict[link] = data;
        return data;
      };
      return get(link, check, callback);
    };
    exports = {
      getSettings: getSettings,
      getCategories: getCategories,
      getPosts: getPosts,
      getPost: getPost
    };
    return exports;
  });

}).call(this);

!function(){"use strict";function a(){var a={"&":"&#38;","<":"&#60;",">":"&#62;",'"':"&#34;","'":"&#39;","/":"&#47;"},b=/&(?!#?\w+;)|<|>|"|'|\//g;return function(){return this?this.replace(b,function(b){return a[b]||b}):this}}function b(a,c,d){return("string"==typeof c?c:c.toString()).replace(a.define||g,function(b,c,e,f){return 0===c.indexOf("def.")&&(c=c.substring(4)),c in d||(":"===e?(a.defineParams&&f.replace(a.defineParams,function(a,b,e){d[c]={arg:b,text:e}}),c in d||(d[c]=f)):new Function("def","def['"+c+"']="+f)(d)),""}).replace(a.use||g,function(c,e){a.useParams&&(e=e.replace(a.useParams,function(a,b,c,e){if(d[c]&&d[c].arg&&e){var f=(c+":"+e).replace(/'|\\/g,"_");return d.__exp=d.__exp||{},d.__exp[f]=d[c].text.replace(new RegExp("(^|[^\\w$])"+d[c].arg+"([^\\w$])","g"),"$1"+e+"$2"),b+"def.__exp['"+f+"']"}}));var f=new Function("def","return "+e)(d);return f?b(a,f,d):f})}function c(a){return a.replace(/\\('|\\)/g,"$1").replace(/[\r\t\n]/g," ")}var d,e={version:"1.0.1",templateSettings:{evaluate:/\{\{([\s\S]+?(\}?)+)\}\}/g,interpolate:/\{\{=([\s\S]+?)\}\}/g,encode:/\{\{!([\s\S]+?)\}\}/g,use:/\{\{#([\s\S]+?)\}\}/g,useParams:/(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,define:/\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,defineParams:/^\s*([\w$]+):([\s\S]+)/,conditional:/\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,iterate:/\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,varname:"it",strip:!0,append:!0,selfcontained:!1},template:void 0,compile:void 0};"undefined"!=typeof module&&module.exports?module.exports=e:"function"==typeof define&&define.amd?define('doT',[],function(){return e}):(d=function(){return this||(0,eval)("this")}(),d.doT=e),String.prototype.encodeHTML=a();var f={append:{start:"'+(",end:")+'",endencode:"||'').toString().encodeHTML()+'"},split:{start:"';out+=(",end:");out+='",endencode:"||'').toString().encodeHTML();out+='"}},g=/$^/;e.template=function(d,h,i){h=h||e.templateSettings;var j,k,l=h.append?f.append:f.split,m=0,n=h.use||h.define?b(h,d,i||{}):d;n=("var out='"+(h.strip?n.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g," ").replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,""):n).replace(/'|\\/g,"\\$&").replace(h.interpolate||g,function(a,b){return l.start+c(b)+l.end}).replace(h.encode||g,function(a,b){return j=!0,l.start+c(b)+l.endencode}).replace(h.conditional||g,function(a,b,d){return b?d?"';}else if("+c(d)+"){out+='":"';}else{out+='":d?"';if("+c(d)+"){out+='":"';}out+='"}).replace(h.iterate||g,function(a,b,d,e){return b?(m+=1,k=e||"i"+m,b=c(b),"';var arr"+m+"="+b+";if(arr"+m+"){var "+d+","+k+"=-1,l"+m+"=arr"+m+".length-1;while("+k+"<l"+m+"){"+d+"=arr"+m+"["+k+"+=1];out+='"):"';} } out+='"}).replace(h.evaluate||g,function(a,b){return"';"+c(b)+"out+='"})+"';return out;").replace(/\n/g,"\\n").replace(/\t/g,"\\t").replace(/\r/g,"\\r").replace(/(\s|;|\}|^|\{)out\+='';/g,"$1").replace(/\+''/g,"").replace(/(\s|;|\}|^|\{)out\+=''\+/g,"$1out+="),j&&h.selfcontained&&(n="String.prototype.encodeHTML=("+a.toString()+"());"+n);try{return new Function(h.varname,n)}catch(o){throw"undefined"!=typeof console&&console.log("Could not create a template function: "+n),o}},e.compile=function(a,b){return e.template(a,null,b)}}();
(function() {
  define('providers/template',['doT'], function(doT) {
    var exports, handlers;
    handlers = {};
    exports = {
      render: function(data, id, tmpl) {
        if (!handlers.hasOwnProperty(id)) {
          if (tmpl) {
            handlers[id] = doT.template(tmpl);
          } else {
            handlers[id] = function() {
              return '';
            };
          }
        }
        return handlers[id](data);
      }
    };
    return exports;
  });

}).call(this);

define('text',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});

define('text!templates/nav.tmpl.html',[],function () { return '<ul class="master">\r\n    {{~ it:item:key }}\r\n    <li>\r\n        <a href="####" data-id="{{= item.name }}">{{= item.title }}</a>\r\n        <div class="slave" data-master="{{= item.name }}">\r\n            <ul>\r\n                {{~ item.categories:ele:k }}\r\n                <li><a href="#/{{= item.name }}/{{= ele.name }}">{{= ele.title }}</a></li>\r\n                {{~}}\r\n            </ul>\r\n        </div>\r\n    </li>\r\n    {{~}}\r\n</ul>';});

!function(){"use strict";function a(a){a.fn.swiper=function(c){var d;return a(this).each(function(){var a=new b(this,c);d||(d=a)}),d}}var b=function(a,c){function d(){return"horizontal"===p.params.direction}function e(){p.autoplayTimeoutId=setTimeout(function(){p.params.loop?(p.fixLoop(),p._slideNext()):p.isEnd?c.autoplayStopOnLast?p.stopAutoplay():p._slideTo(0):p._slideNext()},p.params.autoplay)}function f(a,b){var c=q(a.target);if(!c.is(b))if("string"==typeof b)c=c.parents(b);else if(b.nodeType){var d;return c.parents().each(function(a,c){c===b&&(d=b)}),d?b:void 0}return 0===c.length?void 0:c[0]}function g(a,b){b=b||{};var c=window.MutationObserver||window.WebkitMutationObserver,d=new c(function(a){a.forEach(function(a){p.onResize(!0),p.emit("onObserverUpdate",p,a)})});d.observe(a,{attributes:"undefined"==typeof b.attributes?!0:b.attributes,childList:"undefined"==typeof b.childList?!0:b.childList,characterData:"undefined"==typeof b.characterData?!0:b.characterData}),p.observers.push(d)}function h(a){a.originalEvent&&(a=a.originalEvent);var b=a.keyCode||a.charCode;if(!p.params.allowSwipeToNext&&(d()&&39===b||!d()&&40===b))return!1;if(!p.params.allowSwipeToPrev&&(d()&&37===b||!d()&&38===b))return!1;if(!(a.shiftKey||a.altKey||a.ctrlKey||a.metaKey||document.activeElement&&document.activeElement.nodeName&&("input"===document.activeElement.nodeName.toLowerCase()||"textarea"===document.activeElement.nodeName.toLowerCase()))){if(37===b||39===b||38===b||40===b){var c=!1;if(p.container.parents(".swiper-slide").length>0&&0===p.container.parents(".swiper-slide-active").length)return;for(var e={left:window.pageXOffset,top:window.pageYOffset},f=window.innerWidth,g=window.innerHeight,h=p.container.offset(),i=[[h.left,h.top],[h.left+p.width,h.top],[h.left,h.top+p.height],[h.left+p.width,h.top+p.height]],j=0;j<i.length;j++){var k=i[j];k[0]>=e.left&&k[0]<=e.left+f&&k[1]>=e.top&&k[1]<=e.top+g&&(c=!0)}if(!c)return}d()?((37===b||39===b)&&(a.preventDefault?a.preventDefault():a.returnValue=!1),39===b&&p.slideNext(),37===b&&p.slidePrev()):((38===b||40===b)&&(a.preventDefault?a.preventDefault():a.returnValue=!1),40===b&&p.slideNext(),38===b&&p.slidePrev())}}function i(a){a.originalEvent&&(a=a.originalEvent);var b=p._wheelEvent,c=0;if(a.detail)c=-a.detail;else if("mousewheel"===b)if(p.params.mousewheelForceToAxis)if(d()){if(!(Math.abs(a.wheelDeltaX)>Math.abs(a.wheelDeltaY)))return;c=a.wheelDeltaX}else{if(!(Math.abs(a.wheelDeltaY)>Math.abs(a.wheelDeltaX)))return;c=a.wheelDeltaY}else c=a.wheelDelta;else if("DOMMouseScroll"===b)c=-a.detail;else if("wheel"===b)if(p.params.mousewheelForceToAxis)if(d()){if(!(Math.abs(a.deltaX)>Math.abs(a.deltaY)))return;c=-a.deltaX}else{if(!(Math.abs(a.deltaY)>Math.abs(a.deltaX)))return;c=-a.deltaY}else c=Math.abs(a.deltaX)>Math.abs(a.deltaY)?-a.deltaX:-a.deltaY;if(p.params.freeMode){var e=p.getWrapperTranslate()+c;if(e>0&&(e=0),e<p.maxTranslate()&&(e=p.maxTranslate()),p.setWrapperTransition(0),p.setWrapperTranslate(e),p.updateProgress(),p.updateActiveIndex(),0===e||e===p.maxTranslate())return}else(new window.Date).getTime()-p._lastWheelScrollTime>60&&(0>c?p.slideNext():p.slidePrev()),p._lastWheelScrollTime=(new window.Date).getTime();return p.params.autoplay&&p.stopAutoplay(),a.preventDefault?a.preventDefault():a.returnValue=!1,!1}function j(a,b){a=q(a);var c,e,f;c=a.attr("data-swiper-parallax")||"0",e=a.attr("data-swiper-parallax-x"),f=a.attr("data-swiper-parallax-y"),e||f?(e=e||"0",f=f||"0"):d()?(e=c,f="0"):(f=c,e="0"),e=e.indexOf("%")>=0?parseInt(e,10)*b+"%":e*b+"px",f=f.indexOf("%")>=0?parseInt(f,10)*b+"%":f*b+"px",a.transform("translate3d("+e+", "+f+",0px)")}function k(a){return 0!==a.indexOf("on")&&(a=a[0]!==a[0].toUpperCase()?"on"+a[0].toUpperCase()+a.substring(1):"on"+a),a}if(!(this instanceof b))return new b(a,c);var l={direction:"horizontal",touchEventsTarget:"container",initialSlide:0,speed:300,autoplay:!1,autoplayDisableOnInteraction:!0,freeMode:!1,freeModeMomentum:!0,freeModeMomentumRatio:1,freeModeMomentumBounce:!0,freeModeMomentumBounceRatio:1,freeModeSticky:!1,setWrapperSize:!1,virtualTranslate:!1,effect:"slide",coverflow:{rotate:50,stretch:0,depth:100,modifier:1,slideShadows:!0},cube:{slideShadows:!0,shadow:!0,shadowOffset:20,shadowScale:.94},fade:{crossFade:!1},parallax:!1,scrollbar:null,scrollbarHide:!0,keyboardControl:!1,mousewheelControl:!1,mousewheelForceToAxis:!1,hashnav:!1,spaceBetween:0,slidesPerView:1,slidesPerColumn:1,slidesPerColumnFill:"column",slidesPerGroup:1,centeredSlides:!1,touchRatio:1,touchAngle:45,simulateTouch:!0,shortSwipes:!0,longSwipes:!0,longSwipesRatio:.5,longSwipesMs:300,followFinger:!0,onlyExternal:!1,threshold:0,touchMoveStopPropagation:!0,pagination:null,paginationClickable:!1,paginationHide:!1,paginationBulletRender:null,resistance:!0,resistanceRatio:.85,nextButton:null,prevButton:null,watchSlidesProgress:!1,watchSlidesVisibility:!1,grabCursor:!1,preventClicks:!0,preventClicksPropagation:!0,slideToClickedSlide:!1,lazyLoading:!1,lazyLoadingInPrevNext:!1,lazyLoadingOnTransitionStart:!1,preloadImages:!0,updateOnImagesReady:!0,loop:!1,loopAdditionalSlides:0,loopedSlides:null,control:void 0,controlInverse:!1,allowSwipeToPrev:!0,allowSwipeToNext:!0,swipeHandler:null,noSwiping:!0,noSwipingClass:"swiper-no-swiping",slideClass:"swiper-slide",slideActiveClass:"swiper-slide-active",slideVisibleClass:"swiper-slide-visible",slideDuplicateClass:"swiper-slide-duplicate",slideNextClass:"swiper-slide-next",slidePrevClass:"swiper-slide-prev",wrapperClass:"swiper-wrapper",bulletClass:"swiper-pagination-bullet",bulletActiveClass:"swiper-pagination-bullet-active",buttonDisabledClass:"swiper-button-disabled",paginationHiddenClass:"swiper-pagination-hidden",observer:!1,observeParents:!1,a11y:!1,prevSlideMessage:"Previous slide",nextSlideMessage:"Next slide",firstSlideMessage:"This is the first slide",lastSlideMessage:"This is the last slide",runCallbacksOnInit:!0},m=c&&c.virtualTranslate;c=c||{};for(var n in l)if("undefined"==typeof c[n])c[n]=l[n];else if("object"==typeof c[n])for(var o in l[n])"undefined"==typeof c[n][o]&&(c[n][o]=l[n][o]);var p=this;p.version="3.0.7",p.params=c,p.classNames=[];var q;if(q="undefined"==typeof Dom7?window.Dom7||window.Zepto||window.jQuery:Dom7,q&&(p.$=q,p.container=q(a),0!==p.container.length)){if(p.container.length>1)return void p.container.each(function(){new b(this,c)});p.container[0].swiper=p,p.container.data("swiper",p),p.classNames.push("swiper-container-"+p.params.direction),p.params.freeMode&&p.classNames.push("swiper-container-free-mode"),p.support.flexbox||(p.classNames.push("swiper-container-no-flexbox"),p.params.slidesPerColumn=1),(p.params.parallax||p.params.watchSlidesVisibility)&&(p.params.watchSlidesProgress=!0),["cube","coverflow"].indexOf(p.params.effect)>=0&&(p.support.transforms3d?(p.params.watchSlidesProgress=!0,p.classNames.push("swiper-container-3d")):p.params.effect="slide"),"slide"!==p.params.effect&&p.classNames.push("swiper-container-"+p.params.effect),"cube"===p.params.effect&&(p.params.resistanceRatio=0,p.params.slidesPerView=1,p.params.slidesPerColumn=1,p.params.slidesPerGroup=1,p.params.centeredSlides=!1,p.params.spaceBetween=0,p.params.virtualTranslate=!0,p.params.setWrapperSize=!1),"fade"===p.params.effect&&(p.params.slidesPerView=1,p.params.slidesPerColumn=1,p.params.slidesPerGroup=1,p.params.watchSlidesProgress=!0,p.params.spaceBetween=0,"undefined"==typeof m&&(p.params.virtualTranslate=!0)),p.params.grabCursor&&p.support.touch&&(p.params.grabCursor=!1),p.wrapper=p.container.children("."+p.params.wrapperClass),p.params.pagination&&(p.paginationContainer=q(p.params.pagination),p.params.paginationClickable&&p.paginationContainer.addClass("swiper-pagination-clickable")),p.rtl=d()&&("rtl"===p.container[0].dir.toLowerCase()||"rtl"===p.container.css("direction")),p.rtl&&p.classNames.push("swiper-container-rtl"),p.rtl&&(p.wrongRTL="-webkit-box"===p.wrapper.css("display")),p.params.slidesPerColumn>1&&p.classNames.push("swiper-container-multirow"),p.device.android&&p.classNames.push("swiper-container-android"),p.container.addClass(p.classNames.join(" ")),p.translate=0,p.progress=0,p.velocity=0,p.lockSwipeToNext=function(){p.params.allowSwipeToNext=!1},p.lockSwipeToPrev=function(){p.params.allowSwipeToPrev=!1},p.lockSwipes=function(){p.params.allowSwipeToNext=p.params.allowSwipeToPrev=!1},p.unlockSwipeToNext=function(){p.params.allowSwipeToNext=!0},p.unlockSwipeToPrev=function(){p.params.allowSwipeToPrev=!0},p.unlockSwipes=function(){p.params.allowSwipeToNext=p.params.allowSwipeToPrev=!0},p.params.grabCursor&&(p.container[0].style.cursor="move",p.container[0].style.cursor="-webkit-grab",p.container[0].style.cursor="-moz-grab",p.container[0].style.cursor="grab"),p.imagesToLoad=[],p.imagesLoaded=0,p.loadImage=function(a,b,c,d){function e(){d&&d()}var f;a.complete&&c?e():b?(f=new window.Image,f.onload=e,f.onerror=e,f.src=b):e()},p.preloadImages=function(){function a(){"undefined"!=typeof p&&null!==p&&(void 0!==p.imagesLoaded&&p.imagesLoaded++,p.imagesLoaded===p.imagesToLoad.length&&(p.params.updateOnImagesReady&&p.update(),p.emit("onImagesReady",p)))}p.imagesToLoad=p.container.find("img");for(var b=0;b<p.imagesToLoad.length;b++)p.loadImage(p.imagesToLoad[b],p.imagesToLoad[b].currentSrc||p.imagesToLoad[b].getAttribute("src"),!0,a)},p.autoplayTimeoutId=void 0,p.autoplaying=!1,p.autoplayPaused=!1,p.startAutoplay=function(){return"undefined"!=typeof p.autoplayTimeoutId?!1:p.params.autoplay?p.autoplaying?!1:(p.autoplaying=!0,p.emit("onAutoplayStart",p),void e()):!1},p.stopAutoplay=function(a){p.autoplayTimeoutId&&(p.autoplayTimeoutId&&clearTimeout(p.autoplayTimeoutId),p.autoplaying=!1,p.autoplayTimeoutId=void 0,p.emit("onAutoplayStop",p))},p.pauseAutoplay=function(a){p.autoplayPaused||(p.autoplayTimeoutId&&clearTimeout(p.autoplayTimeoutId),p.autoplayPaused=!0,0===a?(p.autoplayPaused=!1,e()):p.wrapper.transitionEnd(function(){p&&(p.autoplayPaused=!1,p.autoplaying?e():p.stopAutoplay())}))},p.minTranslate=function(){return-p.snapGrid[0]},p.maxTranslate=function(){return-p.snapGrid[p.snapGrid.length-1]},p.updateContainerSize=function(){var a,b;a="undefined"!=typeof p.params.width?p.params.width:p.container[0].clientWidth,b="undefined"!=typeof p.params.height?p.params.height:p.container[0].clientHeight,0===a&&d()||0===b&&!d()||(p.width=a,p.height=b,p.size=d()?p.width:p.height)},p.updateSlidesSize=function(){p.slides=p.wrapper.children("."+p.params.slideClass),p.snapGrid=[],p.slidesGrid=[],p.slidesSizesGrid=[];var a,b=p.params.spaceBetween,c=0,e=0,f=0;"string"==typeof b&&b.indexOf("%")>=0&&(b=parseFloat(b.replace("%",""))/100*p.size),p.virtualSize=-b,p.rtl?p.slides.css({marginLeft:"",marginTop:""}):p.slides.css({marginRight:"",marginBottom:""});var g;p.params.slidesPerColumn>1&&(g=Math.floor(p.slides.length/p.params.slidesPerColumn)===p.slides.length/p.params.slidesPerColumn?p.slides.length:Math.ceil(p.slides.length/p.params.slidesPerColumn)*p.params.slidesPerColumn);var h;for(a=0;a<p.slides.length;a++){h=0;var i=p.slides.eq(a);if(p.params.slidesPerColumn>1){var j,k,l,m,n=p.params.slidesPerColumn;"column"===p.params.slidesPerColumnFill?(k=Math.floor(a/n),l=a-k*n,j=k+l*g/n,i.css({"-webkit-box-ordinal-group":j,"-moz-box-ordinal-group":j,"-ms-flex-order":j,"-webkit-order":j,order:j})):(m=g/n,l=Math.floor(a/m),k=a-l*m),i.css({"margin-top":0!==l&&p.params.spaceBetween&&p.params.spaceBetween+"px"}).attr("data-swiper-column",k).attr("data-swiper-row",l)}"none"!==i.css("display")&&("auto"===p.params.slidesPerView?h=d()?i.outerWidth(!0):i.outerHeight(!0):(h=(p.size-(p.params.slidesPerView-1)*b)/p.params.slidesPerView,d()?p.slides[a].style.width=h+"px":p.slides[a].style.height=h+"px"),p.slides[a].swiperSlideSize=h,p.slidesSizesGrid.push(h),p.params.centeredSlides?(c=c+h/2+e/2+b,0===a&&(c=c-p.size/2-b),Math.abs(c)<.001&&(c=0),f%p.params.slidesPerGroup===0&&p.snapGrid.push(c),p.slidesGrid.push(c)):(f%p.params.slidesPerGroup===0&&p.snapGrid.push(c),p.slidesGrid.push(c),c=c+h+b),p.virtualSize+=h+b,e=h,f++)}p.virtualSize=Math.max(p.virtualSize,p.size);var o;if(p.rtl&&p.wrongRTL&&("slide"===p.params.effect||"coverflow"===p.params.effect)&&p.wrapper.css({width:p.virtualSize+p.params.spaceBetween+"px"}),(!p.support.flexbox||p.params.setWrapperSize)&&(d()?p.wrapper.css({width:p.virtualSize+p.params.spaceBetween+"px"}):p.wrapper.css({height:p.virtualSize+p.params.spaceBetween+"px"})),p.params.slidesPerColumn>1&&(p.virtualSize=(h+p.params.spaceBetween)*g,p.virtualSize=Math.ceil(p.virtualSize/p.params.slidesPerColumn)-p.params.spaceBetween,p.wrapper.css({width:p.virtualSize+p.params.spaceBetween+"px"}),p.params.centeredSlides)){for(o=[],a=0;a<p.snapGrid.length;a++)p.snapGrid[a]<p.virtualSize+p.snapGrid[0]&&o.push(p.snapGrid[a]);p.snapGrid=o}if(!p.params.centeredSlides){for(o=[],a=0;a<p.snapGrid.length;a++)p.snapGrid[a]<=p.virtualSize-p.size&&o.push(p.snapGrid[a]);p.snapGrid=o,Math.floor(p.virtualSize-p.size)>Math.floor(p.snapGrid[p.snapGrid.length-1])&&p.snapGrid.push(p.virtualSize-p.size)}0===p.snapGrid.length&&(p.snapGrid=[0]),0!==p.params.spaceBetween&&(d()?p.rtl?p.slides.css({marginLeft:b+"px"}):p.slides.css({marginRight:b+"px"}):p.slides.css({marginBottom:b+"px"})),p.params.watchSlidesProgress&&p.updateSlidesOffset()},p.updateSlidesOffset=function(){for(var a=0;a<p.slides.length;a++)p.slides[a].swiperSlideOffset=d()?p.slides[a].offsetLeft:p.slides[a].offsetTop},p.updateSlidesProgress=function(a){if("undefined"==typeof a&&(a=p.translate||0),0!==p.slides.length){"undefined"==typeof p.slides[0].swiperSlideOffset&&p.updateSlidesOffset();var b=p.params.centeredSlides?-a+p.size/2:-a;p.rtl&&(b=p.params.centeredSlides?a-p.size/2:a);p.container[0].getBoundingClientRect(),d()?"left":"top",d()?"right":"bottom";p.slides.removeClass(p.params.slideVisibleClass);for(var c=0;c<p.slides.length;c++){var e=p.slides[c],f=p.params.centeredSlides===!0?e.swiperSlideSize/2:0,g=(b-e.swiperSlideOffset-f)/(e.swiperSlideSize+p.params.spaceBetween);if(p.params.watchSlidesVisibility){var h=-(b-e.swiperSlideOffset-f),i=h+p.slidesSizesGrid[c],j=h>=0&&h<p.size||i>0&&i<=p.size||0>=h&&i>=p.size;j&&p.slides.eq(c).addClass(p.params.slideVisibleClass)}e.progress=p.rtl?-g:g}}},p.updateProgress=function(a){"undefined"==typeof a&&(a=p.translate||0);var b=p.maxTranslate()-p.minTranslate();0===b?(p.progress=0,p.isBeginning=p.isEnd=!0):(p.progress=(a-p.minTranslate())/b,p.isBeginning=p.progress<=0,p.isEnd=p.progress>=1),p.isBeginning&&p.emit("onReachBeginning",p),p.isEnd&&p.emit("onReachEnd",p),p.params.watchSlidesProgress&&p.updateSlidesProgress(a),p.emit("onProgress",p,p.progress)},p.updateActiveIndex=function(){var a,b,c,d=p.rtl?p.translate:-p.translate;for(b=0;b<p.slidesGrid.length;b++)"undefined"!=typeof p.slidesGrid[b+1]?d>=p.slidesGrid[b]&&d<p.slidesGrid[b+1]-(p.slidesGrid[b+1]-p.slidesGrid[b])/2?a=b:d>=p.slidesGrid[b]&&d<p.slidesGrid[b+1]&&(a=b+1):d>=p.slidesGrid[b]&&(a=b);(0>a||"undefined"==typeof a)&&(a=0),c=Math.floor(a/p.params.slidesPerGroup),c>=p.snapGrid.length&&(c=p.snapGrid.length-1),a!==p.activeIndex&&(p.snapIndex=c,p.previousIndex=p.activeIndex,p.activeIndex=a,p.updateClasses())},p.updateClasses=function(){p.slides.removeClass(p.params.slideActiveClass+" "+p.params.slideNextClass+" "+p.params.slidePrevClass);var a=p.slides.eq(p.activeIndex);if(a.addClass(p.params.slideActiveClass),a.next("."+p.params.slideClass).addClass(p.params.slideNextClass),a.prev("."+p.params.slideClass).addClass(p.params.slidePrevClass),p.bullets&&p.bullets.length>0){p.bullets.removeClass(p.params.bulletActiveClass);var b;p.params.loop?(b=Math.ceil(p.activeIndex-p.loopedSlides)/p.params.slidesPerGroup,b>p.slides.length-1-2*p.loopedSlides&&(b-=p.slides.length-2*p.loopedSlides),b>p.bullets.length-1&&(b-=p.bullets.length)):b="undefined"!=typeof p.snapIndex?p.snapIndex:p.activeIndex||0,p.paginationContainer.length>1?p.bullets.each(function(){q(this).index()===b&&q(this).addClass(p.params.bulletActiveClass)}):p.bullets.eq(b).addClass(p.params.bulletActiveClass)}p.params.loop||(p.params.prevButton&&(p.isBeginning?(q(p.params.prevButton).addClass(p.params.buttonDisabledClass),p.params.a11y&&p.a11y&&p.a11y.disable(q(p.params.prevButton))):(q(p.params.prevButton).removeClass(p.params.buttonDisabledClass),p.params.a11y&&p.a11y&&p.a11y.enable(q(p.params.prevButton)))),p.params.nextButton&&(p.isEnd?(q(p.params.nextButton).addClass(p.params.buttonDisabledClass),p.params.a11y&&p.a11y&&p.a11y.disable(q(p.params.nextButton))):(q(p.params.nextButton).removeClass(p.params.buttonDisabledClass),p.params.a11y&&p.a11y&&p.a11y.enable(q(p.params.nextButton)))))},p.updatePagination=function(){if(p.params.pagination&&p.paginationContainer&&p.paginationContainer.length>0){for(var a="",b=p.params.loop?Math.ceil((p.slides.length-2*p.loopedSlides)/p.params.slidesPerGroup):p.snapGrid.length,c=0;b>c;c++)a+=p.params.paginationBulletRender?p.params.paginationBulletRender(c,p.params.bulletClass):'<span class="'+p.params.bulletClass+'"></span>';p.paginationContainer.html(a),p.bullets=p.paginationContainer.find("."+p.params.bulletClass)}},p.update=function(a){function b(){d=Math.min(Math.max(p.translate,p.maxTranslate()),p.minTranslate()),p.setWrapperTranslate(d),p.updateActiveIndex(),p.updateClasses()}if(p.updateContainerSize(),p.updateSlidesSize(),p.updateProgress(),p.updatePagination(),p.updateClasses(),p.params.scrollbar&&p.scrollbar&&p.scrollbar.set(),a){var c,d;p.params.freeMode?b():(c="auto"===p.params.slidesPerView&&p.isEnd&&!p.params.centeredSlides?p.slideTo(p.slides.length-1,0,!1,!0):p.slideTo(p.activeIndex,0,!1,!0),c||b())}},p.onResize=function(a){if(p.updateContainerSize(),p.updateSlidesSize(),p.updateProgress(),("auto"===p.params.slidesPerView||p.params.freeMode||a)&&p.updatePagination(),p.params.scrollbar&&p.scrollbar&&p.scrollbar.set(),p.params.freeMode){var b=Math.min(Math.max(p.translate,p.maxTranslate()),p.minTranslate());p.setWrapperTranslate(b),p.updateActiveIndex(),p.updateClasses()}else p.updateClasses(),"auto"===p.params.slidesPerView&&p.isEnd&&!p.params.centeredSlides?p.slideTo(p.slides.length-1,0,!1,!0):p.slideTo(p.activeIndex,0,!1,!0)};var r=["mousedown","mousemove","mouseup"];window.navigator.pointerEnabled?r=["pointerdown","pointermove","pointerup"]:window.navigator.msPointerEnabled&&(r=["MSPointerDown","MSPointerMove","MSPointerUp"]),p.touchEvents={start:p.support.touch||!p.params.simulateTouch?"touchstart":r[0],move:p.support.touch||!p.params.simulateTouch?"touchmove":r[1],end:p.support.touch||!p.params.simulateTouch?"touchend":r[2]},(window.navigator.pointerEnabled||window.navigator.msPointerEnabled)&&("container"===p.params.touchEventsTarget?p.container:p.wrapper).addClass("swiper-wp8-"+p.params.direction),p.initEvents=function(a){var b=a?"off":"on",d=a?"removeEventListener":"addEventListener",e="container"===p.params.touchEventsTarget?p.container[0]:p.wrapper[0],f=p.support.touch?e:document,g=p.params.nested?!0:!1;p.browser.ie?(e[d](p.touchEvents.start,p.onTouchStart,!1),f[d](p.touchEvents.move,p.onTouchMove,g),f[d](p.touchEvents.end,p.onTouchEnd,!1)):(p.support.touch&&(e[d](p.touchEvents.start,p.onTouchStart,!1),e[d](p.touchEvents.move,p.onTouchMove,g),e[d](p.touchEvents.end,p.onTouchEnd,!1)),!c.simulateTouch||p.device.ios||p.device.android||(e[d]("mousedown",p.onTouchStart,!1),document[d]("mousemove",p.onTouchMove,g),document[d]("mouseup",p.onTouchEnd,!1))),window[d]("resize",p.onResize),p.params.nextButton&&(q(p.params.nextButton)[b]("click",p.onClickNext),p.params.a11y&&p.a11y&&q(p.params.nextButton)[b]("keydown",p.a11y.onEnterKey)),p.params.prevButton&&(q(p.params.prevButton)[b]("click",p.onClickPrev),p.params.a11y&&p.a11y&&q(p.params.prevButton)[b]("keydown",p.a11y.onEnterKey)),p.params.pagination&&p.params.paginationClickable&&q(p.paginationContainer)[b]("click","."+p.params.bulletClass,p.onClickIndex),(p.params.preventClicks||p.params.preventClicksPropagation)&&e[d]("click",p.preventClicks,!0)},p.attachEvents=function(a){p.initEvents()},p.detachEvents=function(){p.initEvents(!0)},p.allowClick=!0,p.preventClicks=function(a){p.allowClick||(p.params.preventClicks&&a.preventDefault(),p.params.preventClicksPropagation&&(a.stopPropagation(),a.stopImmediatePropagation()))},p.onClickNext=function(a){a.preventDefault(),p.slideNext()},p.onClickPrev=function(a){a.preventDefault(),p.slidePrev()},p.onClickIndex=function(a){a.preventDefault();var b=q(this).index()*p.params.slidesPerGroup;p.params.loop&&(b+=p.loopedSlides),p.slideTo(b)},p.updateClickedSlide=function(a){var b=f(a,"."+p.params.slideClass),c=!1;if(b)for(var d=0;d<p.slides.length;d++)p.slides[d]===b&&(c=!0);if(!b||!c)return p.clickedSlide=void 0,void(p.clickedIndex=void 0);if(p.clickedSlide=b,p.clickedIndex=q(b).index(),p.params.slideToClickedSlide&&void 0!==p.clickedIndex&&p.clickedIndex!==p.activeIndex){var e,g=p.clickedIndex;if(p.params.loop)if(e=q(p.clickedSlide).attr("data-swiper-slide-index"),g>p.slides.length-p.params.slidesPerView)p.fixLoop(),g=p.wrapper.children("."+p.params.slideClass+'[data-swiper-slide-index="'+e+'"]').eq(0).index(),setTimeout(function(){p.slideTo(g)},0);else if(g<p.params.slidesPerView-1){p.fixLoop();var h=p.wrapper.children("."+p.params.slideClass+'[data-swiper-slide-index="'+e+'"]');g=h.eq(h.length-1).index(),setTimeout(function(){p.slideTo(g)},0)}else p.slideTo(g);else p.slideTo(g)}};var s,t,u,v,w,x,y,z,A,B="input, select, textarea, button",C=Date.now(),D=[];p.animating=!1,p.touches={startX:0,startY:0,currentX:0,currentY:0,diff:0};var E,F;if(p.onTouchStart=function(a){if(a.originalEvent&&(a=a.originalEvent),E="touchstart"===a.type,E||!("which"in a)||3!==a.which){if(p.params.noSwiping&&f(a,"."+p.params.noSwipingClass))return void(p.allowClick=!0);if(!p.params.swipeHandler||f(a,p.params.swipeHandler)){if(s=!0,t=!1,v=void 0,F=void 0,p.touches.startX=p.touches.currentX="touchstart"===a.type?a.targetTouches[0].pageX:a.pageX,p.touches.startY=p.touches.currentY="touchstart"===a.type?a.targetTouches[0].pageY:a.pageY,u=Date.now(),p.allowClick=!0,p.updateContainerSize(),p.swipeDirection=void 0,p.params.threshold>0&&(y=!1),"touchstart"!==a.type){var b=!0;q(a.target).is(B)&&(b=!1),document.activeElement&&q(document.activeElement).is(B)&&document.activeElement.blur(),b&&a.preventDefault()}p.emit("onTouchStart",p,a)}}},p.onTouchMove=function(a){if(a.originalEvent&&(a=a.originalEvent),!(E&&"mousemove"===a.type||a.preventedByNestedSwiper)){if(p.params.onlyExternal)return t=!0,void(p.allowClick=!1);if(E&&document.activeElement&&a.target===document.activeElement&&q(a.target).is(B))return t=!0,void(p.allowClick=!1);if(p.emit("onTouchMove",p,a),!(a.targetTouches&&a.targetTouches.length>1)){if(p.touches.currentX="touchmove"===a.type?a.targetTouches[0].pageX:a.pageX,p.touches.currentY="touchmove"===a.type?a.targetTouches[0].pageY:a.pageY,"undefined"==typeof v){var b=180*Math.atan2(Math.abs(p.touches.currentY-p.touches.startY),Math.abs(p.touches.currentX-p.touches.startX))/Math.PI;v=d()?b>p.params.touchAngle:90-b>p.params.touchAngle}if(v&&p.emit("onTouchMoveOpposite",p,a),"undefined"==typeof F&&p.browser.ieTouch&&(p.touches.currentX!==p.touches.startX||p.touches.currentY!==p.touches.startY)&&(F=!0),s){if(v)return void(s=!1);if(F||!p.browser.ieTouch){p.allowClick=!1,p.emit("onSliderMove",p,a),a.preventDefault(),p.params.touchMoveStopPropagation&&!p.params.nested&&a.stopPropagation(),t||(c.loop&&p.fixLoop(),x=p.getWrapperTranslate(),p.setWrapperTransition(0),p.animating&&p.wrapper.trigger("webkitTransitionEnd transitionend oTransitionEnd MSTransitionEnd msTransitionEnd"),p.params.autoplay&&p.autoplaying&&(p.params.autoplayDisableOnInteraction?p.stopAutoplay():p.pauseAutoplay()),A=!1,p.params.grabCursor&&(p.container[0].style.cursor="move",p.container[0].style.cursor="-webkit-grabbing",p.container[0].style.cursor="-moz-grabbin",p.container[0].style.cursor="grabbing")),t=!0;var e=p.touches.diff=d()?p.touches.currentX-p.touches.startX:p.touches.currentY-p.touches.startY;e*=p.params.touchRatio,p.rtl&&(e=-e),p.swipeDirection=e>0?"prev":"next",w=e+x;var f=!0;if(e>0&&w>p.minTranslate()?(f=!1,p.params.resistance&&(w=p.minTranslate()-1+Math.pow(-p.minTranslate()+x+e,p.params.resistanceRatio))):0>e&&w<p.maxTranslate()&&(f=!1,p.params.resistance&&(w=p.maxTranslate()+1-Math.pow(p.maxTranslate()-x-e,p.params.resistanceRatio))),f&&(a.preventedByNestedSwiper=!0),!p.params.allowSwipeToNext&&"next"===p.swipeDirection&&x>w&&(w=x),!p.params.allowSwipeToPrev&&"prev"===p.swipeDirection&&w>x&&(w=x),p.params.followFinger){if(p.params.threshold>0){if(!(Math.abs(e)>p.params.threshold||y))return void(w=x);if(!y)return y=!0,p.touches.startX=p.touches.currentX,p.touches.startY=p.touches.currentY,w=x,void(p.touches.diff=d()?p.touches.currentX-p.touches.startX:p.touches.currentY-p.touches.startY)}(p.params.freeMode||p.params.watchSlidesProgress)&&p.updateActiveIndex(),p.params.freeMode&&(0===D.length&&D.push({position:p.touches[d()?"startX":"startY"],time:u}),D.push({position:p.touches[d()?"currentX":"currentY"],time:(new window.Date).getTime()})),p.updateProgress(w),p.setWrapperTranslate(w)}}}}}},p.onTouchEnd=function(a){if(a.originalEvent&&(a=a.originalEvent),p.emit("onTouchEnd",p,a),s){p.params.grabCursor&&t&&s&&(p.container[0].style.cursor="move",p.container[0].style.cursor="-webkit-grab",p.container[0].style.cursor="-moz-grab",p.container[0].style.cursor="grab");var b=Date.now(),c=b-u;if(p.allowClick&&(p.updateClickedSlide(a),p.emit("onTap",p,a),300>c&&b-C>300&&(z&&clearTimeout(z),z=setTimeout(function(){p&&(p.params.paginationHide&&p.paginationContainer.length>0&&!q(a.target).hasClass(p.params.bulletClass)&&p.paginationContainer.toggleClass(p.params.paginationHiddenClass),p.emit("onClick",p,a))},300)),300>c&&300>b-C&&(z&&clearTimeout(z),p.emit("onDoubleTap",p,a))),C=Date.now(),setTimeout(function(){p&&p.allowClick&&(p.allowClick=!0)},0),!s||!t||!p.swipeDirection||0===p.touches.diff||w===x)return void(s=t=!1);s=t=!1;var d;if(d=p.params.followFinger?p.rtl?p.translate:-p.translate:-w,p.params.freeMode){if(d<-p.minTranslate())return void p.slideTo(p.activeIndex);if(d>-p.maxTranslate())return void(p.slides.length<p.snapGrid.length?p.slideTo(p.snapGrid.length-1):p.slideTo(p.slides.length-1));if(p.params.freeModeMomentum){if(D.length>1){var e=D.pop(),f=D.pop(),g=e.position-f.position,h=e.time-f.time;p.velocity=g/h,p.velocity=p.velocity/2,Math.abs(p.velocity)<.02&&(p.velocity=0),(h>150||(new window.Date).getTime()-e.time>300)&&(p.velocity=0)}else p.velocity=0;D.length=0;var i=1e3*p.params.freeModeMomentumRatio,j=p.velocity*i,k=p.translate+j;p.rtl&&(k=-k);var l,m=!1,n=20*Math.abs(p.velocity)*p.params.freeModeMomentumBounceRatio;if(k<p.maxTranslate())p.params.freeModeMomentumBounce?(k+p.maxTranslate()<-n&&(k=p.maxTranslate()-n),l=p.maxTranslate(),m=!0,A=!0):k=p.maxTranslate();else if(k>p.minTranslate())p.params.freeModeMomentumBounce?(k-p.minTranslate()>n&&(k=p.minTranslate()+n),l=p.minTranslate(),m=!0,A=!0):k=p.minTranslate();else if(p.params.freeModeSticky){var o,r=0;for(r=0;r<p.snapGrid.length;r+=1)if(p.snapGrid[r]>-k){o=r;break}k=Math.abs(p.snapGrid[o]-k)<Math.abs(p.snapGrid[o-1]-k)||"next"===p.swipeDirection?p.snapGrid[o]:p.snapGrid[o-1],p.rtl||(k=-k)}if(0!==p.velocity)i=p.rtl?Math.abs((-k-p.translate)/p.velocity):Math.abs((k-p.translate)/p.velocity);else if(p.params.freeModeSticky)return void p.slideReset();p.params.freeModeMomentumBounce&&m?(p.updateProgress(l),p.setWrapperTransition(i),p.setWrapperTranslate(k),p.onTransitionStart(),p.animating=!0,p.wrapper.transitionEnd(function(){p&&A&&(p.emit("onMomentumBounce",p),p.setWrapperTransition(p.params.speed),p.setWrapperTranslate(l),p.wrapper.transitionEnd(function(){p&&p.onTransitionEnd()}))})):p.velocity?(p.updateProgress(k),p.setWrapperTransition(i),p.setWrapperTranslate(k),p.onTransitionStart(),p.animating||(p.animating=!0,p.wrapper.transitionEnd(function(){p&&p.onTransitionEnd()}))):p.updateProgress(k),p.updateActiveIndex()}return void((!p.params.freeModeMomentum||c>=p.params.longSwipesMs)&&(p.updateProgress(),p.updateActiveIndex()))}var v,y=0,B=p.slidesSizesGrid[0];for(v=0;v<p.slidesGrid.length;v+=p.params.slidesPerGroup)"undefined"!=typeof p.slidesGrid[v+p.params.slidesPerGroup]?d>=p.slidesGrid[v]&&d<p.slidesGrid[v+p.params.slidesPerGroup]&&(y=v,B=p.slidesGrid[v+p.params.slidesPerGroup]-p.slidesGrid[v]):d>=p.slidesGrid[v]&&(y=v,B=p.slidesGrid[p.slidesGrid.length-1]-p.slidesGrid[p.slidesGrid.length-2]);var E=(d-p.slidesGrid[y])/B;if(c>p.params.longSwipesMs){if(!p.params.longSwipes)return void p.slideTo(p.activeIndex);"next"===p.swipeDirection&&(E>=p.params.longSwipesRatio?p.slideTo(y+p.params.slidesPerGroup):p.slideTo(y)),"prev"===p.swipeDirection&&(E>1-p.params.longSwipesRatio?p.slideTo(y+p.params.slidesPerGroup):p.slideTo(y))}else{if(!p.params.shortSwipes)return void p.slideTo(p.activeIndex);"next"===p.swipeDirection&&p.slideTo(y+p.params.slidesPerGroup),"prev"===p.swipeDirection&&p.slideTo(y)}}},p._slideTo=function(a,b){return p.slideTo(a,b,!0,!0)},p.slideTo=function(a,b,c,e){"undefined"==typeof c&&(c=!0),"undefined"==typeof a&&(a=0),0>a&&(a=0),p.snapIndex=Math.floor(a/p.params.slidesPerGroup),p.snapIndex>=p.snapGrid.length&&(p.snapIndex=p.snapGrid.length-1);var f=-p.snapGrid[p.snapIndex];if(!p.params.allowSwipeToNext&&f<p.translate)return!1;if(!p.params.allowSwipeToPrev&&f>p.translate)return!1;p.params.autoplay&&p.autoplaying&&(e||!p.params.autoplayDisableOnInteraction?p.pauseAutoplay(b):p.stopAutoplay()),p.updateProgress(f);for(var g=0;g<p.slidesGrid.length;g++)-f>=p.slidesGrid[g]&&(a=g);if("undefined"==typeof b&&(b=p.params.speed),p.previousIndex=p.activeIndex||0,p.activeIndex=a,f===p.translate)return p.updateClasses(),!1;p.updateClasses(),p.onTransitionStart(c);d()?f:0,d()?0:f;return 0===b?(p.setWrapperTransition(0),p.setWrapperTranslate(f),p.onTransitionEnd(c)):(p.setWrapperTransition(b),p.setWrapperTranslate(f),p.animating||(p.animating=!0,p.wrapper.transitionEnd(function(){p&&p.onTransitionEnd(c)}))),!0},p.onTransitionStart=function(a){"undefined"==typeof a&&(a=!0),p.lazy&&p.lazy.onTransitionStart(),a&&(p.emit("onTransitionStart",p),p.activeIndex!==p.previousIndex&&p.emit("onSlideChangeStart",p))},p.onTransitionEnd=function(a){p.animating=!1,p.setWrapperTransition(0),"undefined"==typeof a&&(a=!0),p.lazy&&p.lazy.onTransitionEnd(),a&&(p.emit("onTransitionEnd",p),p.activeIndex!==p.previousIndex&&p.emit("onSlideChangeEnd",p)),p.params.hashnav&&p.hashnav&&p.hashnav.setHash()},p.slideNext=function(a,b,c){if(p.params.loop){if(p.animating)return!1;p.fixLoop();p.container[0].clientLeft;return p.slideTo(p.activeIndex+p.params.slidesPerGroup,b,a,c)}return p.slideTo(p.activeIndex+p.params.slidesPerGroup,b,a,c)},p._slideNext=function(a){return p.slideNext(!0,a,!0)},p.slidePrev=function(a,b,c){if(p.params.loop){if(p.animating)return!1;p.fixLoop();p.container[0].clientLeft;return p.slideTo(p.activeIndex-1,b,a,c)}return p.slideTo(p.activeIndex-1,b,a,c)},p._slidePrev=function(a){return p.slidePrev(!0,a,!0)},p.slideReset=function(a,b,c){return p.slideTo(p.activeIndex,b,a)},p.setWrapperTransition=function(a,b){p.wrapper.transition(a),"slide"!==p.params.effect&&p.effects[p.params.effect]&&p.effects[p.params.effect].setTransition(a),p.params.parallax&&p.parallax&&p.parallax.setTransition(a),p.params.scrollbar&&p.scrollbar&&p.scrollbar.setTransition(a),p.params.control&&p.controller&&p.controller.setTransition(a,b),p.emit("onSetTransition",p,a)},p.setWrapperTranslate=function(a,b,c){var e=0,f=0,g=0;d()?e=p.rtl?-a:a:f=a,p.params.virtualTranslate||(p.support.transforms3d?p.wrapper.transform("translate3d("+e+"px, "+f+"px, "+g+"px)"):p.wrapper.transform("translate("+e+"px, "+f+"px)")),p.translate=d()?e:f,b&&p.updateActiveIndex(),"slide"!==p.params.effect&&p.effects[p.params.effect]&&p.effects[p.params.effect].setTranslate(p.translate),p.params.parallax&&p.parallax&&p.parallax.setTranslate(p.translate),p.params.scrollbar&&p.scrollbar&&p.scrollbar.setTranslate(p.translate),p.params.control&&p.controller&&p.controller.setTranslate(p.translate,c),p.emit("onSetTranslate",p,p.translate)},p.getTranslate=function(a,b){
var c,d,e,f;return"undefined"==typeof b&&(b="x"),p.params.virtualTranslate?p.rtl?-p.translate:p.translate:(e=window.getComputedStyle(a,null),window.WebKitCSSMatrix?f=new window.WebKitCSSMatrix("none"===e.webkitTransform?"":e.webkitTransform):(f=e.MozTransform||e.OTransform||e.MsTransform||e.msTransform||e.transform||e.getPropertyValue("transform").replace("translate(","matrix(1, 0, 0, 1,"),c=f.toString().split(",")),"x"===b&&(d=window.WebKitCSSMatrix?f.m41:16===c.length?parseFloat(c[12]):parseFloat(c[4])),"y"===b&&(d=window.WebKitCSSMatrix?f.m42:16===c.length?parseFloat(c[13]):parseFloat(c[5])),p.rtl&&d&&(d=-d),d||0)},p.getWrapperTranslate=function(a){return"undefined"==typeof a&&(a=d()?"x":"y"),p.getTranslate(p.wrapper[0],a)},p.observers=[],p.initObservers=function(){if(p.params.observeParents)for(var a=p.container.parents(),b=0;b<a.length;b++)g(a[b]);g(p.container[0],{childList:!1}),g(p.wrapper[0],{attributes:!1})},p.disconnectObservers=function(){for(var a=0;a<p.observers.length;a++)p.observers[a].disconnect();p.observers=[]},p.createLoop=function(){p.wrapper.children("."+p.params.slideClass+"."+p.params.slideDuplicateClass).remove();var a=p.wrapper.children("."+p.params.slideClass);p.loopedSlides=parseInt(p.params.loopedSlides||p.params.slidesPerView,10),p.loopedSlides=p.loopedSlides+p.params.loopAdditionalSlides,p.loopedSlides>a.length&&(p.loopedSlides=a.length);var b,c=[],d=[];for(a.each(function(b,e){var f=q(this);b<p.loopedSlides&&d.push(e),b<a.length&&b>=a.length-p.loopedSlides&&c.push(e),f.attr("data-swiper-slide-index",b)}),b=0;b<d.length;b++)p.wrapper.append(q(d[b].cloneNode(!0)).addClass(p.params.slideDuplicateClass));for(b=c.length-1;b>=0;b--)p.wrapper.prepend(q(c[b].cloneNode(!0)).addClass(p.params.slideDuplicateClass))},p.destroyLoop=function(){p.wrapper.children("."+p.params.slideClass+"."+p.params.slideDuplicateClass).remove(),p.slides.removeAttr("data-swiper-slide-index")},p.fixLoop=function(){var a;p.activeIndex<p.loopedSlides?(a=p.slides.length-3*p.loopedSlides+p.activeIndex,a+=p.loopedSlides,p.slideTo(a,0,!1,!0)):("auto"===p.params.slidesPerView&&p.activeIndex>=2*p.loopedSlides||p.activeIndex>p.slides.length-2*p.params.slidesPerView)&&(a=-p.slides.length+p.activeIndex+p.loopedSlides,a+=p.loopedSlides,p.slideTo(a,0,!1,!0))},p.appendSlide=function(a){if(p.params.loop&&p.destroyLoop(),"object"==typeof a&&a.length)for(var b=0;b<a.length;b++)a[b]&&p.wrapper.append(a[b]);else p.wrapper.append(a);p.params.loop&&p.createLoop(),p.params.observer&&p.support.observer||p.update(!0)},p.prependSlide=function(a){p.params.loop&&p.destroyLoop();var b=p.activeIndex+1;if("object"==typeof a&&a.length){for(var c=0;c<a.length;c++)a[c]&&p.wrapper.prepend(a[c]);b=p.activeIndex+a.length}else p.wrapper.prepend(a);p.params.loop&&p.createLoop(),p.params.observer&&p.support.observer||p.update(!0),p.slideTo(b,0,!1)},p.removeSlide=function(a){p.params.loop&&(p.destroyLoop(),p.slides=p.wrapper.children("."+p.params.slideClass));var b,c=p.activeIndex;if("object"==typeof a&&a.length){for(var d=0;d<a.length;d++)b=a[d],p.slides[b]&&p.slides.eq(b).remove(),c>b&&c--;c=Math.max(c,0)}else b=a,p.slides[b]&&p.slides.eq(b).remove(),c>b&&c--,c=Math.max(c,0);p.params.loop&&p.createLoop(),p.params.observer&&p.support.observer||p.update(!0),p.params.loop?p.slideTo(c+p.loopedSlides,0,!1):p.slideTo(c,0,!1)},p.removeAllSlides=function(){for(var a=[],b=0;b<p.slides.length;b++)a.push(b);p.removeSlide(a)},p.effects={fade:{fadeIndex:null,setTranslate:function(){for(var a=0;a<p.slides.length;a++){var b=p.slides.eq(a),c=b[0].swiperSlideOffset,e=-c;p.params.virtualTranslate||(e-=p.translate);var f=0;d()||(f=e,e=0);var g=p.params.fade.crossFade?Math.max(1-Math.abs(b[0].progress),0):1+Math.min(Math.max(b[0].progress,-1),0);g>0&&1>g&&(p.effects.fade.fadeIndex=a),b.css({opacity:g}).transform("translate3d("+e+"px, "+f+"px, 0px)")}},setTransition:function(a){if(p.slides.transition(a),p.params.virtualTranslate&&0!==a){var b=null!==p.effects.fade.fadeIndex?p.effects.fade.fadeIndex:p.activeIndex;p.params.loop||p.params.fade.crossFade||0!==b||(b=p.slides.length-1),p.slides.eq(b).transitionEnd(function(){if(p)for(var a=["webkitTransitionEnd","transitionend","oTransitionEnd","MSTransitionEnd","msTransitionEnd"],b=0;b<a.length;b++)p.wrapper.trigger(a[b])})}}},cube:{setTranslate:function(){var a,b=0;p.params.cube.shadow&&(d()?(a=p.wrapper.find(".swiper-cube-shadow"),0===a.length&&(a=q('<div class="swiper-cube-shadow"></div>'),p.wrapper.append(a)),a.css({height:p.width+"px"})):(a=p.container.find(".swiper-cube-shadow"),0===a.length&&(a=q('<div class="swiper-cube-shadow"></div>'),p.container.append(a))));for(var c=0;c<p.slides.length;c++){var e=p.slides.eq(c),f=90*c,g=Math.floor(f/360);p.rtl&&(f=-f,g=Math.floor(-f/360));var h=Math.max(Math.min(e[0].progress,1),-1),i=0,j=0,k=0;c%4===0?(i=4*-g*p.size,k=0):(c-1)%4===0?(i=0,k=4*-g*p.size):(c-2)%4===0?(i=p.size+4*g*p.size,k=p.size):(c-3)%4===0&&(i=-p.size,k=3*p.size+4*p.size*g),p.rtl&&(i=-i),d()||(j=i,i=0);var l="rotateX("+(d()?0:-f)+"deg) rotateY("+(d()?f:0)+"deg) translate3d("+i+"px, "+j+"px, "+k+"px)";if(1>=h&&h>-1&&(b=90*c+90*h,p.rtl&&(b=90*-c-90*h)),e.transform(l),p.params.cube.slideShadows){var m=d()?e.find(".swiper-slide-shadow-left"):e.find(".swiper-slide-shadow-top"),n=d()?e.find(".swiper-slide-shadow-right"):e.find(".swiper-slide-shadow-bottom");0===m.length&&(m=q('<div class="swiper-slide-shadow-'+(d()?"left":"top")+'"></div>'),e.append(m)),0===n.length&&(n=q('<div class="swiper-slide-shadow-'+(d()?"right":"bottom")+'"></div>'),e.append(n));e[0].progress;m.length&&(m[0].style.opacity=-e[0].progress),n.length&&(n[0].style.opacity=e[0].progress)}}if(p.wrapper.css({"-webkit-transform-origin":"50% 50% -"+p.size/2+"px","-moz-transform-origin":"50% 50% -"+p.size/2+"px","-ms-transform-origin":"50% 50% -"+p.size/2+"px","transform-origin":"50% 50% -"+p.size/2+"px"}),p.params.cube.shadow)if(d())a.transform("translate3d(0px, "+(p.width/2+p.params.cube.shadowOffset)+"px, "+-p.width/2+"px) rotateX(90deg) rotateZ(0deg) scale("+p.params.cube.shadowScale+")");else{var o=Math.abs(b)-90*Math.floor(Math.abs(b)/90),r=1.5-(Math.sin(2*o*Math.PI/360)/2+Math.cos(2*o*Math.PI/360)/2),s=p.params.cube.shadowScale,t=p.params.cube.shadowScale/r,u=p.params.cube.shadowOffset;a.transform("scale3d("+s+", 1, "+t+") translate3d(0px, "+(p.height/2+u)+"px, "+-p.height/2/t+"px) rotateX(-90deg)")}var v=p.isSafari||p.isUiWebView?-p.size/2:0;p.wrapper.transform("translate3d(0px,0,"+v+"px) rotateX("+(d()?0:b)+"deg) rotateY("+(d()?-b:0)+"deg)")},setTransition:function(a){p.slides.transition(a).find(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").transition(a),p.params.cube.shadow&&!d()&&p.container.find(".swiper-cube-shadow").transition(a)}},coverflow:{setTranslate:function(){for(var a=p.translate,b=d()?-a+p.width/2:-a+p.height/2,c=d()?p.params.coverflow.rotate:-p.params.coverflow.rotate,e=p.params.coverflow.depth,f=0,g=p.slides.length;g>f;f++){var h=p.slides.eq(f),i=p.slidesSizesGrid[f],j=h[0].swiperSlideOffset,k=(b-j-i/2)/i*p.params.coverflow.modifier,l=d()?c*k:0,m=d()?0:c*k,n=-e*Math.abs(k),o=d()?0:p.params.coverflow.stretch*k,r=d()?p.params.coverflow.stretch*k:0;Math.abs(r)<.001&&(r=0),Math.abs(o)<.001&&(o=0),Math.abs(n)<.001&&(n=0),Math.abs(l)<.001&&(l=0),Math.abs(m)<.001&&(m=0);var s="translate3d("+r+"px,"+o+"px,"+n+"px)  rotateX("+m+"deg) rotateY("+l+"deg)";if(h.transform(s),h[0].style.zIndex=-Math.abs(Math.round(k))+1,p.params.coverflow.slideShadows){var t=d()?h.find(".swiper-slide-shadow-left"):h.find(".swiper-slide-shadow-top"),u=d()?h.find(".swiper-slide-shadow-right"):h.find(".swiper-slide-shadow-bottom");0===t.length&&(t=q('<div class="swiper-slide-shadow-'+(d()?"left":"top")+'"></div>'),h.append(t)),0===u.length&&(u=q('<div class="swiper-slide-shadow-'+(d()?"right":"bottom")+'"></div>'),h.append(u)),t.length&&(t[0].style.opacity=k>0?k:0),u.length&&(u[0].style.opacity=-k>0?-k:0)}}if(p.browser.ie){var v=p.wrapper[0].style;v.perspectiveOrigin=b+"px 50%"}},setTransition:function(a){p.slides.transition(a).find(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").transition(a)}}},p.lazy={initialImageLoaded:!1,loadImageInSlide:function(a,b){if("undefined"!=typeof a&&("undefined"==typeof b&&(b=!0),0!==p.slides.length)){var c=p.slides.eq(a),d=c.find(".swiper-lazy:not(.swiper-lazy-loaded):not(.swiper-lazy-loading)");!c.hasClass("swiper-lazy")||c.hasClass("swiper-lazy-loaded")||c.hasClass("swiper-lazy-loading")||d.add(c[0]),0!==d.length&&d.each(function(){var a=q(this);a.addClass("swiper-lazy-loading");var d=a.attr("data-background"),e=a.attr("data-src");p.loadImage(a[0],e||d,!1,function(){if(d?(a.css("background-image","url("+d+")"),a.removeAttr("data-background")):(a.attr("src",e),a.removeAttr("data-src")),a.addClass("swiper-lazy-loaded").removeClass("swiper-lazy-loading"),c.find(".swiper-lazy-preloader, .preloader").remove(),p.params.loop&&b){var f=c.attr("data-swiper-slide-index");if(c.hasClass(p.params.slideDuplicateClass)){var g=p.wrapper.children('[data-swiper-slide-index="'+f+'"]:not(.'+p.params.slideDuplicateClass+")");p.lazy.loadImageInSlide(g.index(),!1)}else{var h=p.wrapper.children("."+p.params.slideDuplicateClass+'[data-swiper-slide-index="'+f+'"]');p.lazy.loadImageInSlide(h.index(),!1)}}p.emit("onLazyImageReady",p,c[0],a[0])}),p.emit("onLazyImageLoad",p,c[0],a[0])})}},load:function(){if(p.params.watchSlidesVisibility)p.wrapper.children("."+p.params.slideVisibleClass).each(function(){p.lazy.loadImageInSlide(q(this).index())});else if(p.params.slidesPerView>1)for(var a=p.activeIndex;a<p.activeIndex+p.params.slidesPerView;a++)p.slides[a]&&p.lazy.loadImageInSlide(a);else p.lazy.loadImageInSlide(p.activeIndex);if(p.params.lazyLoadingInPrevNext){var b=p.wrapper.children("."+p.params.slideNextClass);b.length>0&&p.lazy.loadImageInSlide(b.index());var c=p.wrapper.children("."+p.params.slidePrevClass);c.length>0&&p.lazy.loadImageInSlide(c.index())}},onTransitionStart:function(){p.params.lazyLoading&&(p.params.lazyLoadingOnTransitionStart||!p.params.lazyLoadingOnTransitionStart&&!p.lazy.initialImageLoaded)&&p.lazy.load()},onTransitionEnd:function(){p.params.lazyLoading&&!p.params.lazyLoadingOnTransitionStart&&p.lazy.load()}},p.scrollbar={set:function(){if(p.params.scrollbar){var a=p.scrollbar;a.track=q(p.params.scrollbar),a.drag=a.track.find(".swiper-scrollbar-drag"),0===a.drag.length&&(a.drag=q('<div class="swiper-scrollbar-drag"></div>'),a.track.append(a.drag)),a.drag[0].style.width="",a.drag[0].style.height="",a.trackSize=d()?a.track[0].offsetWidth:a.track[0].offsetHeight,a.divider=p.size/p.virtualSize,a.moveDivider=a.divider*(a.trackSize/p.size),a.dragSize=a.trackSize*a.divider,d()?a.drag[0].style.width=a.dragSize+"px":a.drag[0].style.height=a.dragSize+"px",a.divider>=1?a.track[0].style.display="none":a.track[0].style.display="",p.params.scrollbarHide&&(a.track[0].style.opacity=0)}},setTranslate:function(){if(p.params.scrollbar){var a,b=p.scrollbar,c=(p.translate||0,b.dragSize);a=(b.trackSize-b.dragSize)*p.progress,p.rtl&&d()?(a=-a,a>0?(c=b.dragSize-a,a=0):-a+b.dragSize>b.trackSize&&(c=b.trackSize+a)):0>a?(c=b.dragSize+a,a=0):a+b.dragSize>b.trackSize&&(c=b.trackSize-a),d()?(p.support.transforms3d?b.drag.transform("translate3d("+a+"px, 0, 0)"):b.drag.transform("translateX("+a+"px)"),b.drag[0].style.width=c+"px"):(p.support.transforms3d?b.drag.transform("translate3d(0px, "+a+"px, 0)"):b.drag.transform("translateY("+a+"px)"),b.drag[0].style.height=c+"px"),p.params.scrollbarHide&&(clearTimeout(b.timeout),b.track[0].style.opacity=1,b.timeout=setTimeout(function(){b.track[0].style.opacity=0,b.track.transition(400)},1e3))}},setTransition:function(a){p.params.scrollbar&&p.scrollbar.drag.transition(a)}},p.controller={setTranslate:function(a,c){function d(b){a=b.rtl&&"horizontal"===b.params.direction?-p.translate:p.translate,e=(b.maxTranslate()-b.minTranslate())/(p.maxTranslate()-p.minTranslate()),f=(a-p.minTranslate())*e+b.minTranslate(),p.params.controlInverse&&(f=b.maxTranslate()-f),b.updateProgress(f),b.setWrapperTranslate(f,!1,p),b.updateActiveIndex()}var e,f,g=p.params.control;if(p.isArray(g))for(var h=0;h<g.length;h++)g[h]!==c&&g[h]instanceof b&&d(g[h]);else g instanceof b&&c!==g&&d(g)},setTransition:function(a,c){function d(b){b.setWrapperTransition(a,p),0!==a&&(b.onTransitionStart(),b.wrapper.transitionEnd(function(){f&&b.onTransitionEnd()}))}var e,f=p.params.control;if(p.isArray(f))for(e=0;e<f.length;e++)f[e]!==c&&f[e]instanceof b&&d(f[e]);else f instanceof b&&c!==f&&d(f)}},p.hashnav={init:function(){if(p.params.hashnav){p.hashnav.initialized=!0;var a=document.location.hash.replace("#","");if(a)for(var b=0,c=0,d=p.slides.length;d>c;c++){var e=p.slides.eq(c),f=e.attr("data-hash");if(f===a&&!e.hasClass(p.params.slideDuplicateClass)){var g=e.index();p.slideTo(g,b,p.params.runCallbacksOnInit,!0)}}}},setHash:function(){p.hashnav.initialized&&p.params.hashnav&&(document.location.hash=p.slides.eq(p.activeIndex).attr("data-hash")||"")}},p.disableKeyboardControl=function(){q(document).off("keydown",h)},p.enableKeyboardControl=function(){q(document).on("keydown",h)},p._wheelEvent=!1,p._lastWheelScrollTime=(new window.Date).getTime(),p.params.mousewheelControl){if(void 0!==document.onmousewheel&&(p._wheelEvent="mousewheel"),!p._wheelEvent)try{new window.WheelEvent("wheel"),p._wheelEvent="wheel"}catch(G){}p._wheelEvent||(p._wheelEvent="DOMMouseScroll")}p.disableMousewheelControl=function(){return p._wheelEvent?(p.container.off(p._wheelEvent,i),!0):!1},p.enableMousewheelControl=function(){return p._wheelEvent?(p.container.on(p._wheelEvent,i),!0):!1},p.parallax={setTranslate:function(){p.container.children("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]").each(function(){j(this,p.progress)}),p.slides.each(function(){var a=q(this);a.find("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]").each(function(){var b=Math.min(Math.max(a[0].progress,-1),1);j(this,b)})})},setTransition:function(a){"undefined"==typeof a&&(a=p.params.speed),p.container.find("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]").each(function(){var b=q(this),c=parseInt(b.attr("data-swiper-parallax-duration"),10)||a;0===a&&(c=0),b.transition(c)})}},p._plugins=[];for(var H in p.plugins){var I=p.plugins[H](p,p.params[H]);I&&p._plugins.push(I)}return p.callPlugins=function(a){for(var b=0;b<p._plugins.length;b++)a in p._plugins[b]&&p._plugins[b][a](arguments[1],arguments[2],arguments[3],arguments[4],arguments[5])},p.emitterEventListeners={},p.emit=function(a){p.params[a]&&p.params[a](arguments[1],arguments[2],arguments[3],arguments[4],arguments[5]);var b;if(p.emitterEventListeners[a])for(b=0;b<p.emitterEventListeners[a].length;b++)p.emitterEventListeners[a][b](arguments[1],arguments[2],arguments[3],arguments[4],arguments[5]);p.callPlugins&&p.callPlugins(a,arguments[1],arguments[2],arguments[3],arguments[4],arguments[5])},p.on=function(a,b){return a=k(a),p.emitterEventListeners[a]||(p.emitterEventListeners[a]=[]),p.emitterEventListeners[a].push(b),p},p.off=function(a,b){var c;if(a=k(a),"undefined"==typeof b)return p.emitterEventListeners[a]=[],p;if(p.emitterEventListeners[a]&&0!==p.emitterEventListeners[a].length){for(c=0;c<p.emitterEventListeners[a].length;c++)p.emitterEventListeners[a][c]===b&&p.emitterEventListeners[a].splice(c,1);return p}},p.once=function(a,b){a=k(a);var c=function(){b(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]),p.off(a,c)};return p.on(a,c),p},p.a11y={makeFocusable:function(a){return a[0].tabIndex="0",a},addRole:function(a,b){return a.attr("role",b),a},addLabel:function(a,b){return a.attr("aria-label",b),a},disable:function(a){return a.attr("aria-disabled",!0),a},enable:function(a){return a.attr("aria-disabled",!1),a},onEnterKey:function(a){13===a.keyCode&&(q(a.target).is(p.params.nextButton)?(p.onClickNext(a),p.isEnd?p.a11y.notify(p.params.lastSlideMsg):p.a11y.notify(p.params.nextSlideMsg)):q(a.target).is(p.params.prevButton)&&(p.onClickPrev(a),p.isBeginning?p.a11y.notify(p.params.firstSlideMsg):p.a11y.notify(p.params.prevSlideMsg)))},liveRegion:q('<span class="swiper-notification" aria-live="assertive" aria-atomic="true"></span>'),notify:function(a){var b=p.a11y.liveRegion;0!==b.length&&(b.html(""),b.html(a))},init:function(){if(p.params.nextButton){var a=q(p.params.nextButton);p.a11y.makeFocusable(a),p.a11y.addRole(a,"button"),p.a11y.addLabel(a,p.params.nextSlideMsg)}if(p.params.prevButton){var b=q(p.params.prevButton);p.a11y.makeFocusable(b),p.a11y.addRole(b,"button"),p.a11y.addLabel(b,p.params.prevSlideMsg)}q(p.container).append(p.a11y.liveRegion)},destroy:function(){p.a11y.liveRegion&&p.a11y.liveRegion.length>0&&p.a11y.liveRegion.remove()}},p.init=function(){p.params.loop&&p.createLoop(),p.updateContainerSize(),p.updateSlidesSize(),p.updatePagination(),p.params.scrollbar&&p.scrollbar&&p.scrollbar.set(),"slide"!==p.params.effect&&p.effects[p.params.effect]&&(p.params.loop||p.updateProgress(),p.effects[p.params.effect].setTranslate()),p.params.loop?p.slideTo(p.params.initialSlide+p.loopedSlides,0,p.params.runCallbacksOnInit):(p.slideTo(p.params.initialSlide,0,p.params.runCallbacksOnInit),0===p.params.initialSlide&&(p.parallax&&p.params.parallax&&p.parallax.setTranslate(),p.lazy&&p.params.lazyLoading&&(p.lazy.load(),p.lazy.initialImageLoaded=!0))),p.attachEvents(),p.params.observer&&p.support.observer&&p.initObservers(),p.params.preloadImages&&!p.params.lazyLoading&&p.preloadImages(),p.params.autoplay&&p.startAutoplay(),p.params.keyboardControl&&p.enableKeyboardControl&&p.enableKeyboardControl(),p.params.mousewheelControl&&p.enableMousewheelControl&&p.enableMousewheelControl(),p.params.hashnav&&p.hashnav&&p.hashnav.init(),p.params.a11y&&p.a11y&&p.a11y.init(),p.emit("onInit",p)},p.cleanupStyles=function(){p.container.removeClass(p.classNames.join(" ")).removeAttr("style"),p.wrapper.removeAttr("style"),p.slides&&p.slides.length&&p.slides.removeClass([p.params.slideVisibleClass,p.params.slideActiveClass,p.params.slideNextClass,p.params.slidePrevClass].join(" ")).removeAttr("style").removeAttr("data-swiper-column").removeAttr("data-swiper-row"),p.paginationContainer&&p.paginationContainer.length&&p.paginationContainer.removeClass(p.params.paginationHiddenClass),p.bullets&&p.bullets.length&&p.bullets.removeClass(p.params.bulletActiveClass),p.params.prevButton&&q(p.params.prevButton).removeClass(p.params.buttonDisabledClass),p.params.nextButton&&q(p.params.nextButton).removeClass(p.params.buttonDisabledClass),p.params.scrollbar&&p.scrollbar&&(p.scrollbar.track&&p.scrollbar.track.length&&p.scrollbar.track.removeAttr("style"),p.scrollbar.drag&&p.scrollbar.drag.length&&p.scrollbar.drag.removeAttr("style"))},p.destroy=function(a,b){p.detachEvents(),p.stopAutoplay(),p.params.loop&&p.destroyLoop(),b&&p.cleanupStyles(),p.disconnectObservers(),p.params.keyboardControl&&p.disableKeyboardControl&&p.disableKeyboardControl(),p.params.mousewheelControl&&p.disableMousewheelControl&&p.disableMousewheelControl(),p.params.a11y&&p.a11y&&p.a11y.destroy(),p.emit("onDestroy"),a!==!1&&(p=null)},p.init(),p}};b.prototype={isSafari:function(){var a=navigator.userAgent.toLowerCase();return a.indexOf("safari")>=0&&a.indexOf("chrome")<0&&a.indexOf("android")<0}(),isUiWebView:/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent),isArray:function(a){return"[object Array]"===Object.prototype.toString.apply(a)},browser:{ie:window.navigator.pointerEnabled||window.navigator.msPointerEnabled,ieTouch:window.navigator.msPointerEnabled&&window.navigator.msMaxTouchPoints>1||window.navigator.pointerEnabled&&window.navigator.maxTouchPoints>1},device:function(){var a=navigator.userAgent,b=a.match(/(Android);?[\s\/]+([\d.]+)?/),c=a.match(/(iPad).*OS\s([\d_]+)/),d=(a.match(/(iPod)(.*OS\s([\d_]+))?/),!c&&a.match(/(iPhone\sOS)\s([\d_]+)/));return{ios:c||d||c,android:b}}(),support:{touch:window.Modernizr&&Modernizr.touch===!0||function(){return!!("ontouchstart"in window||window.DocumentTouch&&document instanceof DocumentTouch)}(),transforms3d:window.Modernizr&&Modernizr.csstransforms3d===!0||function(){var a=document.createElement("div").style;return"webkitPerspective"in a||"MozPerspective"in a||"OPerspective"in a||"MsPerspective"in a||"perspective"in a}(),flexbox:function(){for(var a=document.createElement("div").style,b="alignItems webkitAlignItems webkitBoxAlign msFlexAlign mozBoxAlign webkitFlexDirection msFlexDirection mozBoxDirection mozBoxOrient webkitBoxDirection webkitBoxOrient".split(" "),c=0;c<b.length;c++)if(b[c]in a)return!0}(),observer:function(){return"MutationObserver"in window||"WebkitMutationObserver"in window}()},plugins:{}};for(var c=["jQuery","Zepto","Dom7"],d=0;d<c.length;d++)window[c[d]]&&a(window[c[d]]);var e;e="undefined"==typeof Dom7?window.Dom7||window.Zepto||window.jQuery:Dom7,e&&("transitionEnd"in e.fn||(e.fn.transitionEnd=function(a){function b(f){if(f.target===this)for(a.call(this,f),c=0;c<d.length;c++)e.off(d[c],b)}var c,d=["webkitTransitionEnd","transitionend","oTransitionEnd","MSTransitionEnd","msTransitionEnd"],e=this;if(a)for(c=0;c<d.length;c++)e.on(d[c],b);return this}),"transform"in e.fn||(e.fn.transform=function(a){for(var b=0;b<this.length;b++){var c=this[b].style;c.webkitTransform=c.MsTransform=c.msTransform=c.MozTransform=c.OTransform=c.transform=a}return this}),"transition"in e.fn||(e.fn.transition=function(a){"string"!=typeof a&&(a+="ms");for(var b=0;b<this.length;b++){var c=this[b].style;c.webkitTransitionDuration=c.MsTransitionDuration=c.msTransitionDuration=c.MozTransitionDuration=c.OTransitionDuration=c.transitionDuration=a}return this})),window.Swiper=b}(),"undefined"!=typeof module?module.exports=window.Swiper:"function"==typeof define&&define.amd&&define('swiper',[],function(){"use strict";return window.Swiper});
(function() {
  define('controllers/touch',['jquery', 'swiper'], function($, Swiper) {
    var Touch, isTouch, swiper;
    swiper = null;
    isTouch = function() {
      return $('body').width() < 641;
    };
    Touch = (function() {
      function Touch() {
        $(function() {
          if (isTouch()) {
            swiper = new Swiper('.swiper-container');
            $('body').swipeLeft(function() {
              return swiper.slideNext();
            });
            return $('body').swipeRight(function() {
              return swiper.slidePrev();
            });
          }
        });
      }

      Touch.prototype.toPost = function() {
        if (isTouch()) {
          return swiper.slideTo(0);
        }
      };

      Touch.prototype.toList = function() {
        if (isTouch()) {
          return swiper.slideTo(1);
        }
      };

      return Touch;

    })();
    return new Touch;
  });

}).call(this);

(function() {
  define('controllers/nav',['jquery', 'EventEmitter', 'providers/data', 'providers/template', 'text!templates/nav.tmpl.html', 'controllers/touch'], function($, EventEmitter, data, template, navTmpl, touch) {
    var Navigation, emitter;
    emitter = new EventEmitter;
    Navigation = (function() {
      function Navigation() {
        var that;
        that = this;
        this.loaded = false;
        this.timer = null;
        this.el = $('#nav');
        if (!this.categories) {
          data.getCategories().then(this.load.bind(this)).fail(function(err) {
            throw err;
          });
        }
        $('body').click(function(e) {
          return that.hide();
        });
      }

      Navigation.prototype.load = function(categories) {
        var convert, that;
        convert = function(obj) {
          var arr, key, val;
          arr = [];
          for (key in obj) {
            val = obj[key];
            if (obj.hasOwnProperty(key)) {
              if (val.categories) {
                val.categories = convert(val.categories);
              }
              arr.push(val);
            }
          }
          return arr;
        };
        that = this;
        this.categories = convert(categories);
        this.navHTML = template.render(this.categories, 'tmpl-nav', navTmpl);
        this.el.html(this.navHTML);
        $('#nav ul.master > li > a').click(function(e) {
          that.show($(this));
          touch.toList();
          return false;
        });
        this.loaded = true;
        return emitter.emit('loaded');
      };

      Navigation.prototype.hide = function() {
        return $('#nav div.slave').hide();
      };

      Navigation.prototype.show = function(ele) {
        var id, that;
        that = this;
        id = ele.attr('data-id');
        that.hide();
        if (that.timer) {
          clearTimeout(that.timer);
        }
        $("#nav div.slave[data-master=" + id + "]").show();
        return that.timer = setTimeout(function() {
          return that.hide();
        }, 5e3);
      };

      Navigation.prototype.setCurrentNav = function(channel, category) {
        var init, that;
        that = this;
        init = function() {
          var ele;
          ele = $("#nav ul.master a[data-id=" + channel + "]");
          return that.show(ele);
        };
        if (this.loaded) {
          return init();
        } else {
          return emitter.on('loaded', init);
        }
      };

      return Navigation;

    })();
    return new Navigation;
  });

}).call(this);

(function() {
  define('providers/async',[], function() {
    var exports, parallel;
    parallel = function(tasks, handler) {
      var counter, counts, createCallback, errors, key, results, task, _results;
      counts = 0;
      counter = 0;
      errors = {};
      results = {};
      createCallback = function(key) {
        return function(err, result) {
          counter++;
          errors[key] = err;
          results[key] = result;
          if (counter === counts) {
            return handler(errors, results);
          }
        };
      };
      _results = [];
      for (key in tasks) {
        task = tasks[key];
        errors[key] = null;
        results[key] = null;
        task(createCallback(key));
        _results.push(counts++);
      }
      return _results;
    };
    exports = {
      parallel: parallel
    };
    return exports;
  });

}).call(this);


define('text!templates/list_has_date.tmpl.html',[],function () { return '<ul>\r\n    {{~ it.posts:item:idx }}\r\n    <li>\r\n        <a href="#/{{= it.channel }}/{{= item.categories }}/{{= item.filename }}" data-id="{{= item.id }}">[{{= item.pubDate.year }}年{{= item.pubDate.month }}月{{= item.pubDate.day }}日] {{= item.title }}</a>\r\n    </li>\r\n    {{~}}\r\n</ul>\r\n';});


define('text!templates/list_no_date.tmpl.html',[],function () { return '<ul>\r\n    {{~ it.posts:item:idx }}\r\n    <li>\r\n        <a href="#/{{= it.channel }}/{{= item.categories }}/{{= item.filename }}" data-id="{{= item.id }}">{{= item.title }}</a>\r\n    </li>\r\n    {{~}}\r\n</ul>\r\n';});

(function() {
  define('controllers/posts',['jquery', 'EventEmitter', 'providers/async', 'providers/data', 'providers/template', 'text!templates/list_has_date.tmpl.html', 'text!templates/list_no_date.tmpl.html', 'controllers/touch'], function($, EventEmitter, async, data, template, hasDateTmpl, noDateTmpl, touch) {
    var Posts, dict, emitter;
    dict = {
      list_has_date: hasDateTmpl,
      list_no_date: noDateTmpl
    };
    emitter = new EventEmitter;
    Posts = (function() {
      function Posts() {
        var that;
        that = this;
        this.loaded = false;
        this.key = '__all__';
        this.el = $('#list');
        this.categories = {};
        this.posts = {};
        this.currentList = [];
        async.parallel({
          categories: function(callback) {
            return data.getCategories().then(function(categories) {
              return callback(null, categories);
            }).fail(function(err) {
              return callback(err);
            });
          },
          posts: function(callback) {
            return data.getPosts().then(function(posts) {
              return callback(null, posts);
            }).fail(function(err) {
              return callback(err);
            });
          }
        }, function(err, results) {
          var categories, posts;
          categories = results.categories;
          posts = results.posts;
          if (!categories) {
            categories = {};
          }
          if (!posts) {
            posts = [];
          }
          return that.load(categories, posts);
        });
        that.el.delegate('ul li a', 'click', function() {
          return touch.toPost();
        });
      }

      Posts.prototype.load = function(categories, posts) {
        this.categories = categories;
        this.posts[this.key] = posts;
        this.loaded = true;
        return emitter.emit('loaded');
      };

      Posts.prototype.getPosts = function(channel, category) {
        var check, key, post, that, _i, _len, _ref;
        that = this;
        key = ['posts', channel, category].join('-');
        check = function(cate) {
          return cate === category;
        };
        if (!this.posts.hasOwnProperty(key)) {
          this.posts[key] = [];
          if (this.posts.hasOwnProperty(this.key)) {
            _ref = this.posts[this.key];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              post = _ref[_i];
              if (check(post.categories)) {
                this.posts[key].push(post);
              }
            }
          }
        }
        return this.posts[key];
      };

      Posts.prototype.setCurrentList = function(channel, category) {
        var set, that;
        that = this;
        set = function() {
          var id, it, listHTML, tmpl, tmpl_key;
          that.currentList = that.getPosts(channel, category);
          it = {
            channel: channel,
            posts: that.currentList
          };
          id = 'tmpl-common-list';
          tmpl = hasDateTmpl;
          if (that.categories.hasOwnProperty(channel) && that.categories[channel] && that.categories[channel].tmpl) {
            tmpl_key = that.categories[channel].tmpl;
            if (dict.hasOwnProperty(tmpl_key)) {
              id = "tmpl-" + channel + "-list";
              tmpl = dict[tmpl_key];
            }
          }
          listHTML = template.render(it, id, tmpl);
          that.el.html(listHTML);
          return emitter.emit('current-list-ready');
        };
        that.el.html('');
        if (this.loaded) {
          return set();
        } else {
          return emitter.on('loaded', set);
        }
      };

      Posts.prototype.getCurrentPostLink = function(category, link) {
        var defer, get, that, url;
        that = this;
        defer = $.Deferred();
        get = function() {
          if (that.currentList.length) {
            return defer.resolve(that.currentList[0].link);
          } else {
            return defer.resolve('');
          }
        };
        if (category && link) {
          url = ['articles', category, link].join('/');
          defer.resolve(url);
        } else if (this.loaded) {
          get();
        } else {
          emitter.on('current-list-ready', get);
        }
        return defer.promise();
      };

      return Posts;

    })();
    return new Posts;
  });

}).call(this);

(function() {
  define('controllers/post',['jquery', 'providers/data', 'providers/template'], function($, data, template) {
    var Post;
    Post = (function() {
      function Post() {
        this.el = $('#post');
      }

      Post.prototype.setLink = function(link) {
        var that;
        that = this;
        that.el.html('');
        return data.getPost(link).then(function(text) {
          that.el.html("<section>" + text + "</section>");
          return $('article.post-content a', that.el).attr('target', '_blank');
        }).fail(function(err) {
          throw err;
        });
      };

      return Post;

    })();
    return new Post;
  });

}).call(this);

(function() {
  define('controllers/blog',['EventEmitter', 'providers/data', 'controllers/nav', 'controllers/posts', 'controllers/post'], function(EventEmitter, data, nav, posts, post) {
    var Blog, emitter;
    emitter = new EventEmitter;
    Blog = (function() {
      function Blog() {
        var that;
        that = this;
        this.loaded = false;
        if (!this.categories) {
          data.getCategories().then(this.load.bind(this)).fail(function(err) {
            throw err;
          });
        }
      }

      Blog.prototype.load = function(categories) {
        var that;
        that = this;
        if (categories) {
          that.categories = categories;
        }
        that.loaded = true;
        return emitter.emit('loaded');
      };

      Blog.prototype.show = function(channel, category, link) {
        var pickFirst;
        pickFirst = function(categories) {
          var cate, name;
          if (categories) {
            for (name in categories) {
              cate = categories[name];
              if (categories.hasOwnProperty(name)) {
                return name;
              }
            }
          }
          return '';
        };
        if (!channel) {
          channel = pickFirst(this.categories);
        }
        if (!category) {
          category = pickFirst(this.categories[channel].categories);
        }
        posts.setCurrentList(channel, category);
        return posts.getCurrentPostLink(category, link).then(function(link) {
          return post.setLink(link);
        });
      };

      Blog.prototype.route = function(channel, category, link) {
        var show, that;
        that = this;
        show = function() {
          return that.show(channel, category, link);
        };
        if (that.loaded) {
          show();
        } else {
          emitter.on('loaded', show);
        }
        return false;
      };

      return Blog;

    })();
    return new Blog;
  });

}).call(this);

(function() {
  define('routes',['controllers/blog'], function(blog) {
    var exports;
    exports = {
      '/:channel/:category/(.*\.html)': blog.route.bind(blog),
      '/:channel/:category': blog.route.bind(blog),
      '/:channel': blog.route.bind(blog),
      '/': blog.route.bind(blog)
    };
    return exports;
  });

}).call(this);


define('text!templates/top_banner.tmpl.html',[],function () { return '<div class="wrapper">{{= it.text }}</div>';});


define('text!templates/copyright.tmpl.html',[],function () { return '&copy; {{= it.text }}';});

(function() {
  define('controllers/site',['jquery', 'providers/data', 'providers/template', 'text!templates/top_banner.tmpl.html', 'text!templates/copyright.tmpl.html'], function($, data, template, bannerTmpl, copyrightTmpl, statisticsTmpl) {
    var Site;
    Site = (function() {
      function Site() {
        var that;
        this.banner = $('#top-banner');
        this.brand = $('#brand');
        this.copyright = $('#copyright');
        if (!this.settings) {
          that = this;
          data.getSettings().then(this.load.bind(this)).fail(function(err) {
            throw err;
          });
        }
      }

      Site.prototype.load = function(settings) {
        var site, that;
        that = this;
        this.settings = settings;
        site = settings.site;
        document.title = "" + site.title + "- " + site.brand;
        this.brand.html(site.brand);
        this.render(this.banner, {
          text: site.tagline
        }, 'top-banner', bannerTmpl);
        return this.render(this.copyright, {
          text: site.copyright
        }, 'copyright', copyrightTmpl);
      };

      Site.prototype.render = function(container, data, id, tmpl) {
        var html;
        html = template.render(data, "tmpl-" + id, tmpl);
        return container.html(html);
      };

      return Site;

    })();
    return new Site;
  });

}).call(this);

(function() {
  requirejs.config({
    baseUrl: 'scripts/app',
    shim: {
      async: {
        exports: 'async'
      },
      jquery: {
        exports: 'Zepto'
      },
      doT: {
        exports: 'doT'
      },
      director: {
        exports: 'Router'
      },
      EventEmitter: {
        exports: 'EventEmitter'
      }
    }
  });

  require(['jquery', 'director', 'routes', 'controllers/site', 'controllers/nav', 'controllers/touch'], function($, director, routes, site, nav, touch) {
    var router;
    router = director(routes);
    router.configure({
      recurse: 'forward'
    });
    return router.init('/');
  });

}).call(this);

define("main", function(){});

