/**
 * @file n.js main file
 * @author Jed Fox
 * @copyright Copyright © 2016 Jed Fox
 * @license MIT
 * Thanks to http://youmightnotneedjquery.com for jQuery replacement.
 */

(function() {
  'use strict';
  /**
   * @typedef {?(function|boolean)} Action
   * @description
   * A callback for a button on a notification.
   * Possible values:
   *   * `function(event)`: passed the same arguments
   * as the callback to `$.fn.click`.
   * If the return value is falsy but not
   * `undefined`, the notification will not dismiss.
   *   * `Boolean`: This is equivalent to specifying a
   * function that always returns this value.
   *   * `undefined` or `null`: Equivalent to `true`.
   */

  /**
   * @typedef {Object.<string, Action>} Actions
   * @description
   * Object describing the buttons on the right side of a notification.
   *   + Key: the text of the button
   *   + Value: the callback for the button.
   */

  /**
   * @function extend
   * @private
   * @description like `$.extend`: `extend(defaults, opts1, ...)`
   * @author http://youmightnotneedjquery.com/#extend
   */
  var extend = function(defaults) {
    for (var i = 1; i < arguments.length; i++) {
      if (!arguments[i]) continue;

      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key) && arguments[i][key]) {
          defaults[key] = arguments[i][key];
        }
      }
    }
    return defaults;
  };

  /**
   * @namespace _NotificationCenterProto
   * @private
   * @lends NotificationCenter
   */
  var _NotificationCenterProto = Object.create(HTMLElement.prototype);

  /**
   * Add a notification to the notification center.
   *
   * The keys for the `opts` argument:
   *   - `icon`: the icon to display in the notification
   *   - `title`: the title of the notification
   *   - `subtitle`: the subtitle of the notification
   *   - `text`: the message in the notification
   *   - `actions`: see {@link Actions}
   *   - `minimal`: If this is truthy, the action buttons will slide over the body on hover, and disappear on mouseout.
   *   - `click`: The action to run on clicking the notification. See the callbacks in `actions`.
   *   - `template`: the template for the notification.
   *
   * @function addNotification
   * @memberof NotificationCenter
   * @instance
   * @param {Object} opts The options for the notification.
   * @return {NotificationBox} The created notification.
   */
  _NotificationCenterProto.addNotification = function(opts) {
    opts = extend({
      icon: this.defaultIcon,
      title: this.defaultTitle || "\xA0",
      subtitle: "",
      text: "",
      actions: this.defaultActions || {"Close": null},
      minimal: this.defaultToMinimal || false,
      click: this.defaultClickAction || false,
/* jshint multistr: true */
      template: this.notificationTemplate || '\
<div class="height-container">\
  <div class="main"><div class="icon">\
    <img alt="">\
  </div>\
  <div class="msg">\
    <div class="title"></div>\
    <div class="subtitle"></div>\
    <div class="text"></div>\
  </div>\
  <div class="actions"></div>\
</div>'
/* jshint multistr: false */
    }, opts);
    var notif = document.createElement('notification-box');
    notif.innerHTML = opts.template;

    notif.icon = opts.icon;
    notif.title = opts.title;
    notif.subtitle = opts.subtitle;
    notif.text = (opts.text || opts.subtitle) ? opts.text : "\xA0";
    notif.minimal = !!opts.minimal;
    notif.actions = opts.actions;
    notif.clickAction = opts.click;

    this.insertBefore(notif, this.firstChild);
    return notif;
  };

  /**
   * @member {string} defaultTitle
   * @memberof NotificationCenter
   * @instance
   * The default title for a notification.
   * If no `title` key is specified in `addNotification()`’s `opts` parameter, this title will be used instead.
   */
  _NotificationCenterProto.defaultTitle = "Notification";

  /**
   * @member {string} defaultIcon
   * @memberof NotificationCenter
   * @instance
   * The URL to the default icon for a notification.
   * If no `icon` key is specified in `addNotification()`’s `opts` parameter, this icon will be used instead.
   */
  _NotificationCenterProto.defaultIcon = "";

  /**
   * @member {Actions} defaultActions
   * @memberof NotificationCenter
   * @instance
   * The default actions for a notification.
   * If no `actions` key is specified in `addNotification()`’s
   * `opts` parameter, these actions will be used instead.
   */
  _NotificationCenterProto.defaultActions = undefined;

  /**
   * @member {string} defaultToMinimal
   * @memberof NotificationCenter
   * @instance
   * If this is set to true and no `minimal` key is specified in `addNotification()`’s
   * `opts` parameter, the action buttons will only appear when needed.
   */
  _NotificationCenterProto.defaultToMinimal = false;

  /**
   * @member {Action} defaultClickAction
   * @memberof NotificationCenter
   * @instance
   * The default action that occurrs when clicking the body of the notification.
   * If no `click` key is specified in `addNotification()`’s
   * `opts` parameter, this value will be used instead.
   */
  _NotificationCenterProto.defaultClickAction = false;

  /**
   * @member {string} notificationTemplate
   * @memberof NotificationCenter
   * @instance
   * The template to use inside of each notification box. Change this if you change the class names in the CSS.
   */
   _NotificationCenterProto.notificationTemplate = undefined;

  /**
   * @constructor NotificationCenter
   * @description The constructor for a `<notification-center>` tag.
   */
  window.NotificationCenter = document.registerElement('notification-center', {
    prototype: _NotificationCenterProto
  });

  /**
   * @namespace _NotificationProto
   * @private
   * @lends NotificationBox
   */
  var _NotificationProto = Object.create(HTMLElement.prototype);
  ['icon', 'title', 'subtitle', 'text', 'minimal', 'actions'].forEach(function(key) {
    Object.defineProperty(_NotificationProto, key, {
      set: function(val) {
        this['_'+key] = val;
        try {
          this._updateDOM(key);
        } catch (_) {}
      },
      get: function() {
        return this['_'+key];
      }
    });
  });
  /**
   * @member {string} icon - the URL to the icon shown in the notification.
   * @memberof NotificationBox
   * @instance
   */
   _NotificationProto.icon = "";
   /**
    * @member {string} title - the title of the notification
    * @memberof NotificationBox
    * @instance
    */
   _NotificationProto.title = "";
   /**
    * @member {string} subtitle - the subtitle of the notification
    * @memberof NotificationBox
    * @instance
    */
   _NotificationProto.subtitle = "";
   /**
    *
    * @member {string} text - the body of the notification
    * @memberof NotificationBox
    * @instance
    */
   _NotificationProto.text = "";
   /**
    * @member {boolean} minimal - If true, the buttons only appear on hover.
    * @memberof NotificationBox
    * @instance
    */
   _NotificationProto.minimal = false;
   /**
    * @member {Actions} actions - the action buttons to show.
    * @memberof NotificationBox
    * @instance
    */
   _NotificationProto.actions = {};
   /**
    * @function createdCallback
    * @description
    * Called when an instance of the `NotificationBox` is created.
    *
    * Sets up the click action.
    * @memberof NotificationBox
    * @instance
    * @private
    */
  _NotificationProto.createdCallback = function() {
    this.addEventListener('click', this._handleActionClick.bind(this));
  };
  /**
   * @function attributeChangedCallback
   * @description
   * Called when one of the `<notification-box>` element’s attributes is changed.
   *
   * Changes the correspondng attribute.
   * @memberof NotificationBox
   * @instance
   * @private
   */
  _NotificationProto.attributeChangedCallback = function(attr, oldVal, newVal) {
    if (!attr.indexOf('n-')/* begins with `n-` */) {
      attr = attr.slice(2).toLowerCase(); // remove n- and make lowercase.
      if (!['icon', 'title', 'subtitle', 'text'].indexOf(attr)){
        this[attr] = newVal;
        self._updateDOM(attr);
      }
    }
  };
  /**
   * @function reloadActions
   * @description
   * Reload the action buttons in the user interface.
   * Please call this after modifying `actions`.
   * @memberof NotificationBox
   * @instance
   */
  _NotificationProto.reloadActions = function() {
    this._updateDOM('actions');
  };
  /**
   * @function _updateDOM
   * @description
   * Called when the DOM needs to be updated (after setting a property).
   * @param {string} key The name of the key that was changed.
   * @memberof NotificationBox
   * @instance
   * @private
   */
  _NotificationProto._updateDOM = function(key) {
    if (key) {
      switch (key) {
        case 'icon':
          this._updateIcon();
          break;
        case 'title':
        /* falls through */
        case 'subtitle':
        /* falls through */
        case 'text':
          this._updateBody();
          break;
        case 'actions':
          this._updateActions();
          break;
        default:
          break;
      }
      return;
    } else {
      this._updateIcon();
      this._updateBody();
      this._updateActions();
    }
  };
  _NotificationProto._updateIcon = function() {
    this.querySelector('.icon').style.backgroundImage = 'url("' + this.icon.replace('"', '\\"') + '")';
  };
  _NotificationProto._updateBody = function() {
    ['title', 'subtitle', 'text'].forEach(function(key) {
      this.querySelector('.'+key).textContent = this[key];
    }.bind(this));
  };
  _NotificationProto._updateActions = function() {
    var $actions = this.querySelector('.actions');
    $actions.innerHTML = '';
    if (this.minimal) {
      $actions.classList.add('minimal');
    } else {
      $actions.classList.remove('minimal');
    }
    for (var key in this.actions) {
      if (this.actions.hasOwnProperty(key)) {
        var $action = document.createElement('div');
        $action.className = 'action';
        $action.textContent = key;
        $action.addEventListener('click', this._handleActionClick.bind(this));
        $actions.appendChild($action);
      }
    }
  };
  /**
   * Called when the the notification (or one of its actions) is clicked.
   * Manages the {@link Action} type’s possible values.
   * @memberof NotificationBox
   * @instance
   * @private
   */
  _NotificationProto._handleActionClick = function(event) {
    var cb;
    if (event.target === this) {
      cb = this.clickAction;
    } else {
      var key = event.target.textContent;
      cb = this.actions[key];
    }
    var result = true;
    if (typeof cb == "function") {
      result = cb.apply(event.target, arguments);
      /* jshint -W041 */
      if (result == undefined) {
        /* jshint +W041 */
        result = true;
      }
    } else if (typeof cb == "boolean") {
      result = cb;
    }
    if (result) {
      var $heightContainer = this.querySelector('.height-container');
      $heightContainer.classList.add('hide');
      $heightContainer.addEventListener('animationend', function() {
        try {this.parentNode.removeChild(this); } catch(_) {}
      }.bind(this), 5000 /* animation duration */);
    }
  };
  /**
   * @constructor NotificationBox
   * @description The constructor for a `<notification-box>` tag.
   *
   * The constructor is private, but the methods of
   * this class are public. This is returned from
   * `NotificationCenter.prototype.addNotification()`
   * or by getting any `<notification-box>` element
   * from the DOM.
   * @private
   */
  var NotificationBox = document.registerElement('notification-box', {
    prototype: _NotificationProto
  });
  // jQuery support:
  if (window.jQuery) {
    window.jQuery.fn.addNotification = function(opts) {
      this.filter('notification-center').each(function() {
        this.addNotification(opts);
      });
    };
    /**
     * @function n
     * @memberof jQuery
     * @description
     * Takes either two arguments: (name, value) to set or one argument: (name) to get, or one argument: ({opts}) to set many.
     * @instance
     */
    window.jQuery.fn.n = function(/* name, value or name or {name:value} */) {
      var opts, $boxes = this.filter('notification-box');
      if (arguments.count == 2) {
        opts = {};
        opts[arguments[0]] = arguments[1];
      } else if (arguments.count == 1) {
        if (typeof arguments[0] == "string") {
          return $boxes[0][arguments[0]];
        } else if (typeof arguments[0] == "object") {
          opts = arguments[0];
        }
      }
      $boxes.each(function() {
        for (var key in opts) {
          if (opts.hasOwnProperty(key)) {
            this[key] = value;
          }
        }
      });
    };
  }
}());
