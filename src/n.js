/**
 * @file n.js main file
 * @author Jed Fox
 * @copyright Copyright © 2016 Jed Fox
 * @license MIT
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

  /* *
   * @const _libdoc
   * @private
   * @description The `document` object containing the `<template>` tag for the notification.
   */
  var _libdoc =  (document._currentScript || document.currentScript).ownerDocument;

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
   *
   * @function addNotification
   * @memberof NotificationCenter
   * @instance
   * @param {Object} opts The options for the notification.
   * @return {NotificationBox} The created notification.
   */
  _NotificationCenterProto.addNotification = function(opts) {
    opts = u.extend({
      icon: this.defaultIcon,
      title: this.defaultTitle || "\xA0",
      subtitle: "",
      text: "",
      actions: this.defaultActions || {"Close": null},
      minimal: this.defaultToMinimal || false,
      click: this.defaultClickAction || false
    }, opts);
    var notif = document.createElement('notification-box');
    notif.icon = opts.icon;
    notif.title = opts.title;
    notif.subtitle = opts.subtitle;
    notif.text = (opts.text || opts.subtitle) ? opts.text : "\xA0";
    notif.minimal = !!opts.minimal;
    notif.actions = opts.actions;
    notif.clickAction = opts.click;
    u(this).prepend(notif);
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
  _NotificationCenterProto.defaultActions = {"Close": null};

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
  u.each(['icon', 'title', 'subtitle', 'text', 'minimal', 'actions'], function (_, key) {
    Object.defineProperty(_NotificationProto, key, {
      set: function(val) {
        this['_'+key] = val;
        if (this.updateDOM) {
          this._updateDOM(key);
        }
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
    * Sets up the Shadow DOM and the click action.
    * @memberof NotificationBox
    * @instance
    * @private
    */
  _NotificationProto.createdCallback = function() {
    var tmpl = _libdoc.getElementById('notification');
    var clone= document.importNode(tmpl.content, true);
    this._shadow = this.createShadowRoot();
    this._shadow.appendChild(clone);
    u(this).on('click', this._handleActionClick.bind(this));
  };
  _NotificationProto.attributeChangedCallback = function(attr, oldVal, newVal) {
    if (!attr.indexOf('n-')/* begins with `n-` */) {
      attr = attr.slice(2).toLowerCase(); // remove n- and make lowercase.
      if (!['icon', 'title', 'subtitle', 'text', 'actions'].indexOf(attr)){
        this[attr] = newVal;
        self._updateDOM(attr);
      }
    }
  }
  /**
   * @function reloadActions
   * @description
   * Reload the action buttons in the user interface.
   * Please call this after modifying `actions`.
   * @memberof NotificationBox
   * @instance
   */
  _NotificationProto.reloadActions = function() {
    this._updateDOM('actions')
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
    var $this = u(this._shadow);
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
    }
    this._updateIcon();
    this._updateBody();
    this._updateActions();
  };
  _NotificationProto._updateIcon = function() {
    var $this = u(this._shadow);
    $this.find('.icon').attr('src', this.icon);
  };
  _NotificationProto._updateBody = function() {
    var $this = u(this._shadow);
    u.each(['title', 'subtitle', 'text'], function(_, key) {
      $this.find('.'+key).text(this[key]);
    }.bind(this));
  };
  _NotificationProto._updateActions = function() {
    var $this = u(this._shadow);
    var $actions = uthis
                    .find('.actions')
                    .empty()
                    .toggleClass('minimal', !!this.minimal);
    u.each(this.actions, function(name) {
      $actions.append(
        u('<div class="action"></div>')
          .text(name)
          .click(this._handleActionClick.bind(this))
      );
    }.bind(this));
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
      var key = u(event.target).text();
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
      var heightContainer = u(this._shadow)
                              .find('.height-container')
                              .get(0);
      Velocity(heightContainer, {opacity: 0.001}, 250)
      Velocity(heightContainer, {height: 0}, 250, function () {
        u(this).remove();
      }.bind(this));
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
