(function($){
  $.fn.unfold = function(opts) {
    var $that = $(this);
    var ext = navigator.userAgent.match(/Safari/) ? 'webkit' : 'moz';

    // Measure element width
    var $measure = $that.clone().css({display:'block'});
    $that.after($measure);
    var width = $measure.width();
    $measure.remove();

    opts = $.extend({
      slices: Math.round($that.height() / 100),
      duration: 300,
      perspective: 800,
      operation: 'open',
      easing: null,
      collapse: false,
      shadow: true
    }, opts);

    var sliceHeight = $that.height() / opts.slices;

    var $div = $('<div>').css({
      position: 'relative',
      WebkitPerspective: opts.perspective,
      MozPerspective: opts.perspective,
      WebkitPerspectiveOrigin: 'center 50%',
      MozPerspectiveOrigin: 'center 50%'
    });
    $that.wrap($div);

    var $main = $that.parent().empty();

    for (var i = 0; i < opts.slices; i++) (function(i) {
      var even = (i % 2) == 0;

      var $slice = $('<div>').css({
        position: 'relative',
        height: 0
      });

      if (ext == 'moz') {
        $slice.css({
          MozPerspective: opts.perspective, // Fix FF perspective issue
          overflow: 'hidden'
        });
      }

      var origin = even ? '0px 0px' : '0px ' + sliceHeight + 'px';
      var $outer = $('<div>').css({
        overflow: 'hidden',
        position: 'absolute',
        width: width,
        height: sliceHeight,
        WebkitTransformOrigin: origin,
        MozTransformOrigin: origin
      });

      if (even) {
        $outer.css('top', 0);
      }
      else {
        $outer.css('bottom', 0)
      }

      var $inner = $('<div>').css({
        position: 'absolute',
        top: -(sliceHeight * i)
      });

      var $copy = $that.clone().css({display: 'block'});
      opts.collapse && $('> *:first', $copy).css('margin-top', 0);

      $inner.append($copy);
      $outer.append($inner);
      $slice.append($outer);
      if (opts.shadow) {
        var $shadow = $outer.clone().empty().css({
          backgroundImage: '-' + ext + '-linear-gradient(top, black, transparent)',
          zIndex: 1
        });
        $slice.append($shadow);
      }
      $main.append($slice);

      $outer.animate({ foo: 1 }, {
        duration: opts.duration,
        easing: opts.easing,
        step: function(v) {
          var degs = 90 - 90 * v;
          if (even) degs *= -1;

          var rads = Math.abs(90 - degs) * Math.PI / 180;
          var h = Math.sin(rads) * (sliceHeight);

          var transform = 'rotateX(' + degs + 'deg)';
          $outer.css({
            WebkitTransform: transform,
            MozTransform: transform
          });
          $outer.parent().css('height', h);

          opts.shadow && $shadow.css({
            WebkitTransform: transform,
            MozTransform: transform,
            opacity: .2 - .2 * v
          });
        },
        complete: function() {
          $main.replaceWith($that.css('display', 'block'));
        }
      });
    })(i);

    return this;
  };
  $.fn.fold = function(opts) {
    // Totally doesn't work at all for re-folding
    // - for now, just hide the thing
    $(this).slideUp('fast');
    return this;

    opts = $.extend({
      operation: 'close'
    }, opts);
    $(this).unfold(opts);
  };
})(jQuery);