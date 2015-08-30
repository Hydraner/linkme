var LINKME_LINK_TYPE_A = 0;
var LINKME_LINK_TYPE_URL = 1;
var LINKME_LINK_TYPE_FORM = 2;

(function($) {
  $.fn.linkMe  = function(options) { // Set some default values
    var settings = $.extend({
      // you can either specify all rows
      'row-wrapper-selectors': [],
      'row-link-selectors': [],
      // or you can specify a jquery selector which selects all rows
      'row-wrapper-selector': '',
      // and a link selector which is relative to all rows.
      'row-link-selector': '',
      'linkme-type': LINKME_LINK_TYPE_A
    }, options);

    // Add the click behavior to all rows.
    var length = settings['row-wrapper-selectors'].length;
    var linkme_type = settings['linkme-type'];
    if (length > 0) {
      for (var i = 0; i < length; i++) {
        new LinkMe(this, settings['row-wrapper-selectors'][i], settings['row-link-selectors'][i], linkme_type);
      }
    }
    else {
      // Add the behavior using the row-link-selector method.
      var row_wrapper = settings['row-wrapper-selector'];
      var $elements = this.children(row_wrapper);
      var length = $elements.length;
      for (var i = 0; i < length; i++) {
        var $row_wrapper = jQuery($elements[i]);
        new LinkMe(this, $row_wrapper, settings['row-link-selector'], linkme_type);
      }
    }
    return this;
  };

  /**
   * Object to handler a click on a wrapper element which goes to a certain link/url.
   *
   * @param $wrapper
   *   A selector to a wrapper which is around multiple urls.
   * @param row_wrapper
   *   A selector/jquery-object which points to a single row. A click on this row-wrapper clicks on the link/url.
   * @param url_or_selectors
   *   You can either set a certain url, that should be called on the click or use a selector under the row-wrapper.
   * @param linkme_type
   *   Specify the linkme type, for example LINKME_LINK_TYPE_A for a link.
   */
  var LinkMe = function($wrapper, row_wrapper, url_or_selectors, linkme_type) {
    this.$wrapper = $wrapper;

    if (typeof row_wrapper === 'string') {
      this.row_wrapper = row_wrapper;
      this.$row_wrapper = this.$wrapper.find(this.row_wrapper);
    }
    else {
      this.$row_wrapper = row_wrapper;
    }

    if (linkme_type == LINKME_LINK_TYPE_A) {
      // Check whether it's an url or a selector
      this.$row_wrapper.hover(jQuery.proxy(this.hoverRowWrapper, this), jQuery.proxy(this.unhoverRowWrapper, this));

      var $element = this.$row_wrapper.find(url_or_selectors);
      if ($element.length > 0) {
        this.$link_element = $element;
        this.link_url_type = LINKME_LINK_TYPE_A;
        this.$row_wrapper.attr('title', this.$link_element.attr('title'));
        this.$row_wrapper.find('a').bind('click', jQuery.proxy(this.linkDirectClickHandler, this));
      }
      this.$row_wrapper.bind('click', jQuery.proxy(this.clickLinkHandler, this));
    }
    // It's an url
    else if (linkme_type == LINKME_LINK_TYPE_URL) {
      this.link_url = url_or_selectors;
      this.link_url_type = LINKME_LINK_TYPE_URL;
      this.$row_wrapper.bind('click', jQuery.proxy(this.clickUrlHandler, this));
    }
    else if (linkme_type == LINKME_LINK_TYPE_FORM) {
      // Form elements are a bit special.
      if (row_wrapper == 'parent') {
        this.$row_wrapper = this.$wrapper.parent();
      }
      this.$form_element = this.$row_wrapper.find(url_or_selectors);
      this.$row_wrapper.bind('click', jQuery.proxy(this.clickFormHandler, this));
    }

    this.link_lock = false;
    this.link_click_lock = false;
  };

  LinkMe.prototype.clickLinkHandler = function(event) {
    // A should be able to use their default behavior.
    // For example this is needed because fakeClick will trigger this clickHandler as well.
    if (event.target.localName == 'a') {
      this.link_lock = false;
      return true;
    }
    if (!this.link_lock) {
      this.link_lock = true;
      fakeClick(event, this.$link_element.get()[0]);
      event.preventDefault();
    }
  };

  LinkMe.prototype.clickUrlHandler = function(event) {
    if (event.target.localName == 'a') {
      this.link_lock = false;
      return true;
    }
    if (this.link_url) {
      window.location = this.link_url;
    }
  };

  LinkMe.prototype.clickFormHandler = function(event) {
    if (event.target.localName == 'a') {
      this.link_lock = false;
      return true;
    }
    // toggle the setting.
    this.$form_element.attr('checked', !this.$form_element.attr('checked'));
  };

  /**
   * Only allow the link to be clicked once in a while.
   *
   *  @param event
   */
  LinkMe.prototype.linkDirectClickHandler = function(event) {
    // If the link has subelements, propagate the event to the actual a.
    if (event.target.localName != "a") {
      event.propagate();
      return;
    }

    if (!this.link_click_lock) {
      this.link_click_lock = true;
      setTimeout(jQuery.proxy(this.removeLinkLock, this), 10);
      return true;
    }
    else {
      // @todo: better use event.preventDefault()?
      return false;
    }
  };

  LinkMe.prototype.removeLinkLock = function(event) {
    this.link_click_lock = false;
  };

  LinkMe.prototype.hoverRowWrapper = function() {
    this.$row_wrapper.addClass('linkme-hover');
  };

  LinkMe.prototype.unhoverRowWrapper = function() {
    this.$row_wrapper.removeClass('linkme-hover')
  };


})(jQuery);

/**
 * Fake a click event event.
 *
 * This topic is quite complicated.
 *
 * @see http://stackoverflow.com/questions/1421584/how-can-i-simulate-a-click-to-an-anchor-tag/1421968#1421968
 *
 * @param event
 * @param anchorObj
 */
function fakeClick(event, anchorObj) {
  if (anchorObj.click) {
    anchorObj.click()
  }
  else if (document.createEvent) {
    if (event.target !== anchorObj) {
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window,
        0, 0, 0, 0, 0, false, false, false, false, 0, null);
      var allowDefault = anchorObj.dispatchEvent(evt);
      // you can check allowDefault for false to see if
      // any handler called evt.preventDefault().
      // Firefox will *not* redirect to anchorObj.href
      // for you. However every other browser will.
    }
  }
};
