(function( $ ) {
$(document).ready(function() {
  var options = {};
  options['row-wrapper-selectors'] = ['div.row-1', 'div.row-2'];
  options['row-link-selectors'] = ['a', 'a'];

  $('div.listing').linkMe(options);
});
})( jQuery );