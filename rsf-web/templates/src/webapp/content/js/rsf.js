// RSF.js - primitive definitions for parsing RSF-rendered forms and bindings

// definitions placed in RSF namespace, following approach recommended in 
// http://www.dustindiaz.com/namespace-your-javascript/

var RSF = function() {
 
  function invalidate(invalidated, EL, entry) {
    if (!EL) {
      YAHOO.log("invalidate null EL: " + invalidated + " " + entry);
      }
    var stack = RSF.parseEL(EL);
    invalidated[stack[0]] = entry;
    invalidated[stack[1]] = entry;
    invalidated.list.push(entry);
    YAHOO.log("invalidate " + EL);
    };

  function isInvalidated(invalidated, EL) {
    if (!EL) {
      YAHOO.log("isInvalidated null EL: " + invalidated);
      }
    var stack = RSF.parseEL(EL);
    var togo = invalidated[stack[0]] || invalidated[stack[1]];
    YAHOO.log("isInvalidated "+EL+" " + togo); 
    return togo;
    }

  function isFossil(element, input) {
    if (element.id && input.id == element.id + "-fossil") return true;
    return (input.name == element.name + "-fossil");
    }
    
  function normaliseBinding(element) {
    YAHOO.log("normaliseBinding name " + element.name + " id " + element.id);
    if (!element.name) return element.id;
    else return element.name == "virtual-el-binding"? "el-binding" : element.name;
    }

  var requestactive = false;
  var queuemap = new Object();
  
  function packAJAXRequest(method, url, parameters, callback) {
    return {method: method, url: url, parameters: parameters, callback: callback};
    }
    
  function wrapCallbacks(callbacks, wrapper) {
    var togo = new Object();
    for (var i in callbacks) {
      togo[i] = wrapper(callbacks[i]);
      }
    return togo;
    }
    
  // private defs for addEvent - see attribution comments below
  var addEvent_guid = 1;
  var addEvent_handlers = {};
  
  function handleEvent(event) {
    event = event || fixEvent(window.event);
    var returnValue = true;
    var handlers = addEvent_handlers[this.$$guid][event.type];
    
    for (var i in handlers) {
      if (!Object.prototype[i]) {
        this.$$handler = handlers[i];
        if (this.$$handler(event) === false) returnValue = false;
        }
      }

    if (this.$$handler) this.$$handler = null;
    return returnValue;
    }

  function fixEvent(event) {
    event.preventDefault = fixEvent.preventDefault;
    event.stopPropagation = fixEvent.stopPropagation;
    return event;
    }
    
  fixEvent.preventDefault = function() {
    this.returnValue = false;
    }
    
  fixEvent.stopPropagation = function() {
    this.cancelBubble = true;
    }
  
  function getEventFirer() {
    var listeners = {};
    return {
      addListener: function (listener, exclusions) {
        if (!listener.$$guid) listener.$$guid = addEvent_guid++;
        excludeids = [];
        for (var i in exclusions) {
          excludeids.push(exclusions[i].id);
          }
        listeners[listener.$$guid] = {listener: listener, exclusions: excludeids};
        },
      fireEvent: function() {
        for (var i in listeners) {
          var lisrec = listeners[i];
          var excluded = false;
          for (var j in lisrec.exclusions) {
            var exclusion = lisrec.exclusions[j];
            YAHOO.log("Checking exclusion for " + exclusion);
            if (primaryElements[exclusion]) {
              YAHOO.log("Excluded");
              excluded = true; break;
              }
            }
          if (!excluded) {
            lisrec.listener.apply(null, arguments);
            }
          }
        }
      };
    }
    
  /** Returns the standard registered firer for this field, creating if
    necessary. This will have method "addListener" and "fireEvent" **/
    function getElementFirer (element) {
      if (!element.$$RSF_firer) {
        element.$$RSF_firer = getEventFirer();
        }
      return element.$$RSF_firer;
      }
    var primaryElements = {};
      
    function copyObject(target, newel) {
      for (var i in newel) {
        YAHOO.log("Copied value " + newel[i] + " for key " + i);
        target[i] = newel[i];
        }
      }
    function clearObject(target, newel) {
      for (var i in newel) {
        delete target[i];
        }
      }
    // a THING, that when given "elements", returns a THING, that when it is
    // given a CALLBACK, returns a THING, that does the SAME as the CALLBACK,
    // only with wrappers which are bound to the value that ELEMENTS had at
    // the function start
    function primaryRestorationWrapper() {
      var elementscopy = {};
      copyObject(elementscopy, primaryElements);
      YAHOO.log("Primary elements storing in wrapper");
      
      return function(callback) {
        return function () {
          copyObject(primaryElements, elementscopy);
          try {
            callback.apply(null, arguments);
            }
          finally {
            YAHOO.log("Restoration clearing");
            clearObject(primaryElements, elementscopy);
            YAHOO.log("Restoration cleared");
            }
          }
        }
      }

  return {
    // Following definitions taken from PPK's "Event handling challenge" winner
    // thread comments at 
    // http://www.quirksmode.org/blog/archives/2005/10/_and_the_winner_1.html
    // Primary purpose: Leak avoidance in IE through closure-DOM circles
    // written by Dean Edwards, 2005
    // with input from Tino Zijdel - crisp@xs4all.nl
    // http://dean.edwards.name/weblog/2005/10/add-event/
    // Further fixed by Taco van den Broek 
    // http://dean.edwards.name/weblog/2005/10/add-event/?full#comments
    addEvent: function (element, type, handler) {
      if (element.addEventListener)
        element.addEventListener(type, handler, false);
      else {
        if (!handler.$$guid) handler.$$guid = addEvent_guid++;
        if (!element.$$guid) element.$$guid = addEvent_guid++;
        if (!addEvent_handlers[element.$$guid]) addEvent_handlers[element.$$guid] = {};
        var handlers = addEvent_handlers[element.$$guid][type];
        if (!handlers) {
          handlers = addEvent_handlers[element.$$guid][type] = {};
          if (element['on' + type]) 
            handlers[0] = element['on' + type];
          }
        handlers[handler.$$guid] = handler;
        element['on' + type] = handleEvent;
        }
      },

    removeEvent: function (element, type, handler) {
      if (!element.$$guid) return;
      if (element.removeEventListener)
        element.removeEventListener(type, handler, false);
      if (addEvent_handlers[element.$$guid] && addEvent_handlers[element.$$guid][type]) {
        delete addEvent_handlers[element.$$guid][type][handler.$$guid];
        }
      },
      
  
    /** Gets a function that will update this field's value. Supply "oldvalue"
     * explicitly if this has been an "autonomous" change, otherwise it will
     * be taken from the current value. **/
    getModelFirer: function(element) {
      return function(primary, newvalue, oldvalue) {
        YAHOO.log("modelFirer element " + element.id + " fire primary=" + primary + " newvalue " + newvalue 
            + " oldvalue " + oldvalue);
        if (!primary && primaryElements[element.id]) {
          YAHOO.log("Censored model fire for non-primary element " + element.id);
          return;
          }
        var actualold = arguments.length == 3? oldvalue : element.value;
        YAHOO.log("Actual old value " + actualold);
        if (newvalue != actualold) {
          if (primary) {
            YAHOO.log("Set primary element for " + element.id);
            primaryElements[element.id] = true;
            }
          try {
            var firer = getElementFirer(element);
            YAHOO.log("fieldChange: " + actualold + " to " + newvalue);
            element.value = newvalue;
            firer.fireEvent();
            }
          finally {
            if (primary) {
              YAHOO.log("Unset primary element for " + element.id);
              delete primaryElements[element.id];
              }
            }
          }
        }
      },
    /** target is the element on which the listener is to be attached.
     */
    addElementListener: function(target, listener, exclusions) {
      getElementFirer(target).addListener(listener, exclusions);
      },

    queueAJAXRequest: function(token, method, url, parameters, callbacks) {
      YAHOO.log("queueAJAXRequest: token " + token);
	  YAHOO.log("MESSAGE");
      if (requestactive) {
        YAHOO.log("Request is active, queuing for token " + token);
        queuemap[token] = packAJAXRequest(method, url, parameters, callbacks);
        }
      else {
        requestactive = true;
        var callbacks1 = wrapCallbacks(callbacks, restartWrapper);
        var callbacks2 = wrapCallbacks(callbacks1, primaryRestorationWrapper());
        RSF.issueAJAXRequest(method, url, parameters, callbacks2);
        }
        
      function restartWrapper(callback) {
        return function() {
          requestactive = false;
          YAHOO.log("Restart callback wrapper begin");
          callback.apply(null, arguments);
          YAHOO.log("Callback concluded, beginning restart search");
          for (var i in queuemap) {
            YAHOO.log("Examining for token " + i);
            if (requestactive) return;
            var queued = queuemap[i];
            delete queuemap[i];
            RSF.queueAJAXRequest(token, queued.method, queued.url, queued.parameters, 
              queued.callback);
            }
          };
        }
      },
    
    issueAJAXRequest: function(method, url, parameters, callback) {
      var alertContents = function() {
        if (http_request.readyState == 4) {
          if (http_request.status == 200) {
            YAHOO.log("AJAX request success status: " + http_request.status);
            callback.success(http_request);
            YAHOO.log("AJAX callback concluded");
            } 
          else {
            YAHOO.log("AJAX request error status: " + http_request.status);
            }
          }
        }
      var http_request = false;
      if (window.XMLHttpRequest) { // Mozilla, Safari,...
        http_request = new XMLHttpRequest();
        if (method == "POST" && http_request.overrideMimeType) {
           // set type accordingly to anticipated content type
            //http_request.overrideMimeType('text/xml');
          http_request.overrideMimeType('text/xml');
          }
        } 
        else if (window.ActiveXObject) { // IE
          try {
            http_request = new ActiveXObject("Msxml2.XMLHTTP");
            } 
          catch (e) {
            try {
               http_request = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {}
          }
        }
      if (!http_request) {
        YAHOO.log('Cannot create XMLHTTP instance');
        return false;
      }
      
      http_request.onreadystatechange = alertContents;
      http_request.open(method, url, true);
      http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      http_request.setRequestHeader("Content-length", parameters.length);
      http_request.setRequestHeader("Connection", "close");
      http_request.send(parameters);
      },

  
  
    // From FossilizedConverter.java 
    // key = componentid-fossil, value=[i|o]uitype-name#{bean.member}oldvalue 
    // and
    // key = [deletion|el]-binding, value = [e|o]#{el.lvalue}rvalue 

    parseFossil: function (fossil) {
      fossilex = /(.)(.*)#\{(.*)\}(.*)/;
      var matches = fossil.match(fossilex);
      var togo = new Object();
      togo.input = matches[1] != 'o';
      togo.uitype = matches[2];
      togo.lvalue = matches[3];
      togo.oldvalue = matches[4];
      return togo;
      },

    parseBinding: function (binding, deletion) {
      bindingex = /(.)#\{(.*)\}(.*)/;
      var matches = binding.match(bindingex);
      var togo = new Object();
      togo.EL = matches[1] == 'e';
      togo.lvalue = matches[2];
      togo.rvalue = matches[3];
      togo.isdeletion = deletion == "deletion";
      return togo;
      },

    encodeElement: function(key, value) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(value);
      },
  /** Renders an OBJECT binding, i.e. assigning a concrete value to an EL path **/
    renderBinding: function(lvalue, rvalue) {
      YAHOO.log("renderBinding: " + lvalue + " " + rvalue);
      var binding = RSF.encodeElement("el-binding", "o#{" + lvalue + "}" + rvalue);
      YAHOO.log("Rendered: " + binding);
      return binding;
      },

    renderUVBQuery: function(readEL) {
      return RSF.renderBinding("UVBBean.paths", readEL);
      },
    renderUVBAction: function() {
      return RSF.renderActionBinding("UVBBean.populate");
      },
    renderActionBinding: function (methodbinding) {
      return RSF.encodeElement("Fast track action", methodbinding);
      },
    getUVBResponseID: function(readEL) {
      return ":"+readEL+":";
      },
    /** Accepts a submitting element (<input>) and a list of EL paths to be
     * queried */
    getUVBSubmissionBody: function(elements, queryEL) {
      var queries = new Array();
      for (var i in elements) {
        queries.push(RSF.getPartialSubmissionBody(elements[i]));
        }
      for (var i in queryEL) {
        queries.push(RSF.renderUVBQuery(queryEL[i]));
        }
      queries.push(RSF.renderUVBAction());
      return queries.join("&");      
      },    
    /** Accumulates a response from the UVBView into a compact object 
     * representation.<b>
     * @return o, where o.EL is a map from the requested EL set to the text value
     * returned from the request model, and o.message is a list of {target, text}
     * for any TargettedMessages generated during the request cycle.
     */
    accumulateUVBResponse: function(responseDOM) {
      var togo = new Object();
      togo.EL = new Object();
      togo.message = new Array();
      togo.isError = false;
      var values = responseDOM.getElementsByTagName("value");

      for (var i = 0; i < values.length; ++ i) {
        var value = values[i];
        //if (!value.getAttribute) continue;
        var id = value.getAttribute("id");
        var text = RSF.getElementText(value);
        YAHOO.log("Value id " + id + " text " + text);
        if (id.substring(0, 4) == "tml:") {
          var target = value.getAttribute("target");
          var severity = value.getAttribute("severity");
          togo.message.push( {target: target, severity: severity, text: text});
          if (severity == "error") {
            togo.isError = true;
            }
          }
        else {
          togo.EL[id] = text;
          }
        }
        return togo;
      },
    /** Return the element text from the supplied DOM node as a single String */
    getElementText: function(element) {
      var nodes = element.childNodes;
      var text = "";
      for (var i = 0; i < nodes.length; ++ i) {
        var child = nodes[i];
        if (child.nodeType == 3) {
          text = text + child.nodeValue;
          }
        }
      return text; 
    },
      
    findForm: function (element) {
      while(element) {
      if (element.nodeName.toLowerCase() == "form") return element;
        element = element.parentNode;
        }
      },  
    /** Returns an decreasingly nested set of paths starting with the supplied
     *  EL, thus for path1.path2.path3 will return the list 
     *  {path1.path2.path3,  path1.path2,  path1} */
    parseEL: function(EL) {
      var togo = new Array();
      togo.push(EL);
      while (true) {
        var lastdotpos = EL.lastIndexOf(".");
        if (lastdotpos == -1) break;
        EL = EL.substring(0, lastdotpos);
        togo.push(EL);
        }
      return togo;      
      },
    /** Returns a set of DOM elements (currently of type <input>) 
     * corresponding to the set involved in the EL cascade formed by
     * submission of the supplied element.
     * @param container A DOM element (probably <div>) to be searched for
     * upstream bindings
     * @param element The primary submitting control initiating the cascade.
     */
    getUpstreamElements: function (element) {
      var container = RSF.findForm(element);
      var inputs = container.getElementsByTagName("input");
      var name = element.name;
  
      var fossil;
      var bindings = new Array(); // an array of parsed bindings
  
      var bindingex = /(.*)-binding/; // recognises el-binding as well as virtual-el-binding
  
      for (var i in inputs) {
        var input = inputs[i];
        if (input.name || input.id) {
          var name = input.name? input.name : input.id;
          YAHOO.log("Discovered input name " + name + " value " + input.value);
          if (isFossil(element, input)) {
            fossil = RSF.parseFossil(input.value);
            fossil.element = input;
            YAHOO.log("Own Fossil " + fossil.lvalue + " oldvalue " + fossil.oldvalue);
            }
          var matches = name.match(bindingex);
          if (matches != null) {
            var binding = RSF.parseBinding(input.value, matches[0]);
            YAHOO.log("Binding lvalue " + binding.lvalue + " " + binding.rvalue);
            binding.element = input;
            bindings.push(binding);
            }
          }
        }

      // a map of EL expressions to DOM elements
      var invalidated = new Object();
      invalidated.list = new Array();
      invalidate(invalidated, fossil.lvalue, fossil.element);
      YAHOO.log("Beginning invalidation sweep from initial lvalue " + fossil.lvalue);
   
      // silly O(n^2) algorithm - writing graph algorithms in Javascript is a pain!
      while (true) {
        var expanded = false;
        for (var i in bindings) {
          var binding = bindings[i];
          if (isInvalidated(invalidated, binding.rvalue)) {
            invalidate(invalidated, binding.lvalue, binding.element);
            expanded = true;
            }
            delete bindings[i];
          }
        if (!expanded) break;
        }
      return invalidated.list;
      }, // end getUpstreamElements
      /** Return the body of a "partial submission" POST corresponding to the
     * section of a form contained within argument "container" rooted at
     * the supplied "element", "as if" that form section were to be submitted
     * with element's value set to "value" */ 
    getPartialSubmissionBody: function(element) {
      var upstream = RSF.getUpstreamElements(element);
      var body = new Array();
      // a "virtual field" has no submitting name, implicitly its id.
      var subname = element.name? element.name : element.id; 
      body.push(RSF.encodeElement(subname, element.value));
      for (var i in upstream) {
        var upel = upstream[i];
     
        var fossilex = /(.*)-fossil/;
        var value = upel.value;
        var name = upel.name? upel.name : upel.id;
        if (name.match(fossilex)) {
          value = 'j' + value.substring(1);
          }
        YAHOO.log("Upstream " + i + " name " + name + " value " + value + " el " + upel );
        body.push(RSF.encodeElement(normaliseBinding(upel), value));
        }
      return body.join("&");
      },
    /** Return the ID of another element in the same container as the
    * "base", only with the local ID (rsf:id) given by "targetiD"
    */
    getRelativeID: function(baseid, targetid) {
      colpos = baseid.lastIndexOf(':');
      return baseid.substring(0, colpos + 1) + targetid;
      },
    /** Inbindings is mapping of input EL to their values,
     ** Outbindings is mapping of output EL to their callbacks
     */
     getAJAXUpdater: function (sourceFields, AJAXURL, bindings, callback) {
      // Assumes a FieldDateTransit for which we require to read the "long" format
      var AJAXcallback = {
        success: function(response) {
          YAHOO.log("Response success: " + response + " " + response.responseText);
          var UVB = RSF.accumulateUVBResponse(response.responseXML);
          YAHOO.log("Accumulated " + UVB);
          callback(UVB);
          }
        };
      return function() {
        var body = RSF.getUVBSubmissionBody(sourceFields, bindings);
        YAHOO.log("Firing AJAX request " + body);
        RSF.queueAJAXRequest(bindings[0], "POST", AJAXURL, body, AJAXcallback);
      }
    }
      
    }; // end return internal "Object"
  }(); // end namespace RSF