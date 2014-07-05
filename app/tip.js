(function (root) {
  // TODO better import
  var d3 = root.d3;

  d3.tip = function () {
    var node;
    var svg;
    var content;

    function tip (selection) {
      if (selection.node().tagName === 'svg') {
        svg = selection.node();
      } else {
        svg = selection.node().ownerSVGElement;
      }

      node = d3.select(document.createElement('div'))
        .style('position', 'absolute')
        .style('top', 0)
        .style('left', 0)
        .style('opacity', 0)
        .attr('class', 'd3-tip');
      node.data({});

      document.body.appendChild(node.node());

      return this;
    }

    tip.show = function () {
      node.data(d3.select(this).data())
        .html(content)
        .attr('class', 'd3-tip n')
        .style('opacity', 1)
        .style('top', function () {
          var y = d3.event.pageY - node.node().offsetHeight - 15;
          return y + 'px';
        })
        .style('left', function () {
          var x = d3.event.pageX - node.node().offsetWidth / 2;
          return x + 'px';
        })
      return this;
    };

    tip.hide = function () {
      node.style('opacity', 0);
      return this;
    };

    tip.attr = function () {
      return this;
    };

    tip.html = function (html) {
      content = html;
      return this;
    };

    return tip;
  }

})(this);
