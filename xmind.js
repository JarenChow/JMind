var xmind = new janvas.Canvas({
  container: "#app",
  props: {
    data: { // TODO: node 添加 inverse 属性，使得可以向左布局
      value: "Central Topic",
      children: [
        {
          value: "Main Topic 1",
          children: [
            {value: "Subtopic 1", children: []},
            {value: "Subtopic 2", children: []}
          ]
        },
        {
          value: "Main Topic 2",
          children: [
            {value: "Subtopic 1", children: []}
          ]
        },
        {
          value: "Main Topic 3",
          collapse: true,
          children: [
            {value: "Subtopic 1", children: []},
            {
              value: "Subtopic 2", children: [
                {value: "Subtopic", children: []},
                {value: "Subtopic", children: []}
              ]
            },
            {value: "Subtopic 3", children: []}
          ]
        }
      ]
    },
    style: {
      backgroundColor: "#ecf4f9",
      boxBackgroundColor: "#35bffe19",
      boxBorderColor: "#28beff3d",
      centralSpacing: 50,
      spacing: 26,
      centralVerticalSpacing: 35,
      verticalSpacing: 8,
      centralTopic: {
        backgroundColor: "#35455b", color: "#ffffff", fontSize: 24,
        paddingLeft: 30, paddingTop: 22, paddingBottom: 18
      },
      mainTopic: {
        backgroundColor: "#84a1c9", color: "#ffffff", fontSize: 18,
        paddingLeft: 18, paddingTop: 14, paddingBottom: 12
      },
      subTopic: {
        backgroundColor: "#e2e9f1", color: "#35455b", fontSize: 14,
        paddingLeft: 7, paddingTop: 9, paddingBottom: 6
      },
      centralLink: {
        backgroundColor: "#ecf4f9", backgroundMousein: "#d2dbe2", color: "#35455b",
        lineWidth: 3, spacing: 13, arcToRadius: 8,
        arcRadius: 6, arcRadiusCollapse: 8, arcLineLength: 8, arcLineWidth: 1,
        font: "10px Open Sans"
      },
      mainLink: {
        lineWidth: 2
      }
    },
    point: {
      _locate: new janvas.Point(0, 0),
      _offset: new janvas.Point(0, 0),
      _before: new janvas.Point(0, 0),
      _delta: new janvas.Point(0, 0),
      _conflict: new janvas.Point(0, 0),
      locate: function (x, y) {
        this._locate.init(x, y);
      },
      set: function (x, y) {
        this._offset.init(x, y);
        this._onOffsetChanged();
      },
      add: function (x, y) {
        this._offset.translate(x, y);
        this._onOffsetChanged();
      },
      delta: function (x, y) {
        this._delta.init(x, y);
      },
      isDelta: function () {
        return this._delta.x || this._delta.y;
      },
      eventdown: function () {
        this._conflict.init(0, 0);
        if (!this.animation.isRunning()) this.animation.beforeUpdate();
      },
      eventmove: function (moveX, moveY) {
        if (this.animation.isRunning()) this._conflict.init(moveX, moveY);
        else this.set(this._before.x + moveX - this._conflict.x,
          this._before.y + moveY - this._conflict.y);
      },
      _onOffsetChanged: function () {
        this.onOffsetChanged(this._locate.x + this._offset.x,
          this._locate.y + this._offset.y);
      },
      onOffsetChanged: janvas.Utils.noop
    },
    mouse: {
      type: 0,
      none: 0,
      left: 1,
      right: 2,
      center: 4,
      back: 8,
      front: 16
    },
    format: {
      markdown: {
        prefix: "- ",
        suffix: "\n",
        indent: 2,
        separate: " ",
        regex: /\r\n(?= )/
      },
      xmind: {
        prefix: "",
        suffix: "\n",
        indent: 1,
        separate: "\t",
        regex: /\r\n(?=\t)/
      }
    },
    topic: function (depth) {
      return depth ? "Subtopic" + " " : "Main Topic" + " ";
    }
  },
  components: {
    Node: (function () {
      Node._serialId = 0;

      Node.OPERATION = {
        APPENDCHILD: "_appendOperation",
        REMOVECHILD: "_removeOperation",
        SETVALUE: "_setValueOperation",
        COLLAPSE: "_collapseOperation"
      };

      Node.setOnOperation = function (onOperation) {
        this.prototype.onOperation = onOperation;
      };

      function Node($ctx) {
        this._serialId = Node._serialId++;
        this.$ctx = $ctx;
        this.x = this.y = this.width = this.height = this.borderX = this.borderY = 0;
        this.parent = null;
        this.children = [];
        this.index = 0; // 所处 children 中的 index
        this.depth = 0; // 所处树的深度
        this.value = "";
        this.values = [];
        this.background = new janvas.RoundRect(this.$ctx, 0, 0, 0, 0, 0);
        this.border = new janvas.RoundRect(this.$ctx, 0, 0, 0, 0, 0);
        this.texts = [];
        this.isMousein = false;
        this.isSelected = false;
        this.style = new Node.Style(this);
        this.link = new Node.Link(this); // this.collapse = false;
        this.count = 0;
        this.length = 0; // 全等于 this.children.length
      }

      Node.prototype = {
        reset: function () {
          this.parent = null;
          this.children.length = 0;
          this.length = 0;
          this.index = 0;
          this.depth = 0;
          this.count = 0;
          this.isMousein = false;
          this.isSelected = false; // this.collapse = false;
        },
        apply: function () { // TODO: 整体 x, y, width, height 属性取整
          var style = this.style, x = this.x, y = this.y,
            borderX = x - style.borderOffset, borderY = y - style.borderOffset;
          this.background.setStart(x, y);
          this.border.setStart(borderX, borderY);
          this.borderX = borderX - style._borderOffset;
          this.borderY = borderY - style._borderOffset;
          for (var i = 0, length = this.values.length; i < length; i++) {
            this.texts[i].setStart(x + style.paddingLeft,
              y + style.paddingTop + i * style.lineHeight);
          }
        },
        collidesWith: function (rect) {
          return janvas.Collision.rect(this.x, this.y, this.right, this.bottom,
            rect.getLeft(), rect.getTop(), rect.getRight(), rect.getBottom());
        },
        draw: function () {
          this.background.fill();
          if (this.isMousein || this.isSelected) this.border.stroke();
          for (var i = 0, length = this.values.length; i < length; i++) this.texts[i].fill();
        },
        appendChild: function (child) {
          this.insertChild(child, this.length);
        },
        insertChild: function (child, index) {
          this._appendOperation(child, index);
          this.onOperation(this, child, Node.OPERATION.APPENDCHILD, index,
            Node.OPERATION.REMOVECHILD, null);
        },
        _appendOperation: function (child, index) {
          child.parent = this;
          child.index = index;
          index ? index < this.length ? this.children.splice(index, 0, child) :
            this.children.push(child) : this.children.unshift(child);
          for (var i = this.length++; i > index;) this.children[i--].index++;
          this._appendDepth(child, this.depth + 1);
          this._appendCount(child, child.count + 1);
        },
        _appendDepth: function (node, depth) {
          node.depth = depth;
          node.forEachChild(function (child) {
            this._appendDepth(child, depth + 1);
          }, this);
        },
        _appendCount: function (node, count) {
          while ((node = node.parent)) node.count += count;
        },
        removeChild: function (child) {
          this._removeOperation(child);
          this.onOperation(this, child, Node.OPERATION.REMOVECHILD, null,
            Node.OPERATION.APPENDCHILD, child.index);
        },
        _removeOperation: function (child) {
          for (var i = --this.length; i > child.index;) this.children[i--].index--;
          child.index ? child.index < this.length ? this.children.splice(child.index, 1) :
            this.children.pop() : this.children.shift();
          this._appendCount(child, -(child.count + 1));
        },
        forEachChild: function (callback, context, start, end) {
          if (start === void (0)) start = 0;
          if (end === void (0)) end = this.length;
          var step = end > start ? 1 : -1;
          while (start !== end) {
            callback.call(context, this.children[start]);
            start += step;
          }
        },
        getValue: function () {
          return this.value;
        },
        setValue: function (value) {
          this._setValueOperation(value);
        },
        _setValueOperation: function (value) {
          this.value = value;
          this._apply();
        },
        _apply: function () {
          var value = this.value, values = this.values, length, texts = this.texts,
            style = this.style, width = 0, maxWidth = 0, cursor = 0, i, c, w;
          values.length = 0;
          for (i = 0, length = value.length; i < length; i++) {
            c = value[i];
            if (c === "\n") {
              values.push(value.substring(cursor, i));
              cursor = i + 1;
              if (width > maxWidth) maxWidth = width;
              width = 0;
            } else {
              w = janvas.Utils.measureTextWidth(c, style.font);
              if ((width += w) > style.maxWidth) {
                values.push(value.substring(cursor, i));
                cursor = i;
                maxWidth = style.maxWidth;
                width = w;
              }
            }
          }
          values.push(value.substring(cursor));
          length = values.length;
          while (texts.length < length) {
            var text = new janvas.Text(this.$ctx, 0, 0);
            text.getStyle().setFillStyle(style.color).setFont(style.font)
              .setTextAlign("left").setTextBaseline("top");
            texts.push(text);
          }
          this.background
            .setWidth(this.width = style.paddingLeft + style.paddingRight +
              (width > maxWidth ? width : maxWidth))
            .setHeight(this.height = style.paddingTop + style.paddingBottom +
              style.fontSize + (length - 1) * style.lineHeight);
          this.border
            .setWidth(this.width + style.borderOffset * 2)
            .setHeight(this.height + style.borderOffset * 2);
          for (i = 0; i < length; i++) {
            texts[i].setText(values[i]);
          }
          this.halfWidth = this.width / 2;
          this.halfHeight = this.height / 2;
          this.layoutX += 0;
          this.layoutY += 0;
        },
        eventmove: function (x, y) {
          return this.isMousein = this.background.isPointInPath(x, y);
        },
        select: function () {
          this.isSelected = true;
          this.border.getStyle().setStrokeStyle(this.style.borderColor);
        },
        unselect: function () {
          this.isSelected = this.isMousein = false;
          this.border.getStyle().setStrokeStyle(this.style.borderAlpha);
        },
        hide: function () {
          this.draw = janvas.Utils.noop;
        },
        show: function () {
          this.draw = Node.prototype.draw;
        },
        onValueOperation: function (_value) {
          this.onOperation(this, null, Node.OPERATION.SETVALUE, this.value,
            Node.OPERATION.SETVALUE, _value);
        },
        beforeOffset: function () {
          this._x = this.x;
          this._y = this.y;
        },
        offset: function (offsetX, offsetY) {
          this.layoutX = this._x + offsetX;
          this.layoutY = this._y + offsetY;
        },
        get layoutX() {
          return this.x;
        },
        set layoutX(x) {
          this.x = x;
          this.right = x + this.width;
          this.cx = x + this.halfWidth;
        },
        get layoutY() {
          return this.y;
        },
        set layoutY(y) {
          this.y = y;
          this.bottom = y + this.height;
          this.cy = y + this.halfHeight;
        },
        get collapse() {
          return this._collapse;
        },
        set collapse(collapse) {
          var _collapse = this._collapse;
          this._collapseOperation(collapse); // 须不等判断，否则会造成回收机制 collapse 赋同值
          if (_collapse !== void (0) && _collapse !== collapse) this.onOperation(this, null,
            Node.OPERATION.COLLAPSE, collapse, Node.OPERATION.COLLAPSE, _collapse);
        },
        _collapseOperation: function (collapse) {
          this.link._collapse(this._collapse = collapse);
        },
        get count() {
          return this._count;
        },
        set count(count) {
          this.link._count(this._count = count);
        },
        get length() {
          return this._length;
        },
        set length(length) {
          this.link._length(this._length = length);
        },
        get first() {
          return this.children[0];
        },
        get last() {
          return this.children[this.length - 1];
        },
        get previous() {
          return this.parent.children[this.index - 1];
        },
        get next() {
          return this.parent.children[this.index + 1];
        },
        onOperation: janvas.Utils.noop
      };

      Node.Style = function (target) {
        this.target = target;
      }

      Node.Style.prototype = {
        apply: function (style) {
          this.backgroundColor = style.backgroundColor || "#e2e9f1";
          this.color = style.color || "#35455b";
          this.fontSize = style.fontSize || 14;
          this.fontFamily = "Open Sans";
          this.font = this.fontSize + "px " + this.fontFamily;
          this.lineHeight = Math.floor(this.fontSize * 4 / 3);
          this.maxWidth = 280;
          this.paddingLeft = style.paddingLeft || this.fontSize * 0.625;
          this.paddingRight = style.paddingRight || this.paddingLeft;
          this.paddingTop = style.paddingTop || this.fontSize * 0.5;
          this.paddingBottom = style.paddingBottom || this.paddingTop;
          this.borderRadius = this.fontSize * 0.3;
          this.borderPadding = 2;
          this.borderWidth = 2;
          this._borderOffset = this.borderWidth / 2;
          this.borderOffset = this.borderPadding + this._borderOffset;
          this.borderColor = "#2ebdff";
          this.borderAlpha = this.borderColor + "80";
          this._apply();
        },
        _apply: function () {
          var target = this.target, background = target.background,
            border = target.border, texts = target.texts;
          background.setRadius(this.borderRadius).getStyle()
            .setFillStyle(this.backgroundColor).setLineWidth(this.borderWidth);
          border.setRadius(this.borderRadius).getStyle()
            .setStrokeStyle(target.isSelected ? this.borderColor : this.borderAlpha)
            .setLineWidth(this.borderWidth);
          for (var i = 0, length = texts.length; i < length; i++) {
            texts[i].getStyle().setFillStyle(this.color).setFont(this.font);
          }
          target._apply();
        }
      };

      Node.Link = function (target) {
        this.target = target;
        this._link = new _Link(target.$ctx, 0, 0, target.children, 0, 0);
        this.arc = new janvas.Arc(target.$ctx, 0, 0, 0);
        this.text = new janvas.Text(target.$ctx, 0, 0, "");
        this.line = new janvas.Line(target.$ctx, 0, 0, 0, 0);
        this.style = new Node.Link.Style(this);
        this.isMousein = false;
      }

      Node.Link.prototype = {
        apply: function () {
          var target = this.target, style = this.style, arc = this.arc;
          this._link.setStart(target.right, target.cy);
          arc.setStart(target.right + style.spacing, target.cy);
          this.text.setStart(arc.getStartX(), target.cy);
          this.line.setStart(arc.getStartX() - style.arcLineLength / 2, target.cy)
            .setEndX(arc.getStartX() + style.arcLineLength / 2).setEndY(target.cy);
          if (target.length) {
            this._left = target.right;
            if (target.collapse) {
              this._top = target.cy - arc.getRadius();
              this._right = arc.getStartX() + arc.getRadius();
              this._bottom = target.cy + arc.getRadius();
            } else {
              this._top = target.first.y;
              this._right = target.first.x;
              this._bottom = target.last.bottom;
            }
            this.collidesWith = this._collidesWith;
          } else {
            this.collidesWith = this._noCollision;
          }
        },
        draw: function () {
          if (this.target.length) {
            this._link.stroke();
            if (this.target.collapse) {
              this.arc.fillStroke();
              this.text.fill();
            } else if (this.target.isMousein || this.isMousein) {
              this.arc.fillStroke();
              this.line.stroke();
            }
          }
        },
        eventdown: function () {
          this.target.collapse = !this.target.collapse;
        },
        eventmove: function (x, y) {
          if (this.target.length === 0) return false;
          if (this.isMousein !== (this.target.collapse ? this.arc.isPointInPath(x, y) :
            x >= this._left && x <= this._right && y >= this.target.y && y <= this.target.bottom)) {
            this.arc.getStyle().setFillStyle((this.isMousein = !this.isMousein) ?
              this.style.backgroundMousein : this.style.backgroundColor);
          }
          return this.isMousein;
        },
        _collidesWith: function (rect) {
          return janvas.Collision.rect(this._left, this._top, this._right, this._bottom,
            rect.getLeft(), rect.getTop(), rect.getRight(), rect.getBottom());
        },
        _noCollision: function () {
          return false;
        },
        _count: function (count) {
          this.text.setText(count > 99 ? "..." : count + "");
        },
        _collapse: function (collapse) {
          this._link._collapse = collapse;
          this.arc.setRadius(collapse ?
            this.style.arcRadiusCollapse : this.style.arcRadius);
        },
        _length: function (length) {
          this._link._length = length;
        }
      };

      Node.Link.Style = function (target) {
        this.target = target;
      }

      Node.Link.Style.prototype = {
        apply: function (style) {
          this.backgroundColor = style.backgroundColor || "#ecf4f9";
          this.backgroundMousein = style.backgroundMousein || "#d2dbe2";
          this.color = style.color || "#35455b";
          this.lineWidth = style.lineWidth || 2;
          this.spacing = style.spacing || 13;
          this.arcToRadius = style.arcToRadius || 8;
          this.arcRadius = style.arcRadius || 6;
          this.arcRadiusCollapse = style.arcRadiusCollapse || 8;
          this.arcLineLength = style.arcLineLength || this.arcRadius * 4 / 3;
          this.arcLineWidth = style.arcLineWidth || 1;
          this.font = style.font || "10px Open Sans";
          this._apply();
        },
        _apply: function () {
          var target = this.target, _link = target._link;
          _link.setSpacing(this.spacing);
          _link.setArcToRadius(this.arcToRadius);
          _link.getStyle().setStrokeStyle(this.color).setLineWidth(this.lineWidth);
          target.arc.setRadius(_link._collapse ? this.arcRadiusCollapse : this.arcRadius)
            .getStyle().setLineWidth(this.arcLineWidth).setStrokeStyle(this.color)
            .setFillStyle(target.isMousein ? this.backgroundMousein : this.backgroundColor);
          target.text.getStyle().setFont(this.font).setFillStyle(this.color)
            .setTextAlign("center").setTextBaseline("middle");
          target.line.getStyle().setLineWidth(this.arcLineWidth)
            .setStrokeStyle(this.color);
        }
      };

      function _Link(ctx, sx, sy, children, ox, oy) {
        janvas.Shape.call(this, ctx, sx, sy, ox, oy);
        this.children = children;
      }

      janvas.Utils.inheritPrototype(_Link, janvas.Shape);

      Object.defineProperties(_Link.prototype, {
        process: {
          value: function () {
            var ctx = this.ctx, tx = this._sx + this.spacing, ty = this._sy,
              children = this.children, i, child, ex, ey;
            ctx.beginPath();
            ctx.moveTo(this._sx, ty);
            ctx.lineTo(tx, ty);
            if (this._collapse) return;
            for (i = 0; i < this._length; i++) {
              child = children[i];
              ex = child.x - this.ox;
              ey = child.cy - this.oy;
              if (Math.abs(ey - ty) < this.arcToRadius) {
                ctx.moveTo(tx, ey);
                ctx.lineTo(ex, ey);
              } else {
                ctx.moveTo(tx, ty); // 可以 if (i)，因为第一次已经 lineTo(tx, ty) 了
                ctx.arcTo(tx, ey, ex, ey, this.arcToRadius);
                ctx.lineTo(ex, ey); // 因为 (ex - tx) > this.arcToRadius === true
              }
            }
          }
        },
        setSpacing: {
          value: function (spacing) {
            this.spacing = spacing;
          }
        },
        setArcToRadius: {
          value: function (arcToRadius) {
            this.arcToRadius = arcToRadius;
          }
        }
      });

      return Node;
    }()),
    Selector: (function () {
      function Selector() {
        this.selected = [];
        this._selected = [];
        this._shift = [];
        this.ctrl = null;
      }

      Selector.prototype = {
        select: function (node, ctrlKey, shiftKey) {
          if (node) {
            if (node.isSelected) { // node 已选中的情况
              if (ctrlKey) { // ctrl+选中node->取消选中
                this._unselect(node);
              } else if (shiftKey) { // shift+选中node->范围选中
                this._selectRange(this.ctrl, node);
              } else { // 选中node->仅选中
                this._clear(node);
              }
            } else { // node 未选中的情况
              if (ctrlKey) { // ctrl+未选node->增添选中
                this._select(node);
              } else {
                if (shiftKey) { // shift+未选node
                  if (this.ctrl) { // +已有ctrl->范围选中
                    this._selectRange(this.ctrl, node);
                  } else { // 没有ctrl->仅选中
                    this._select(node);
                  }
                } else { // 选中node->仅选中
                  this._clear(node);
                }
              }
            }
          } else if (!ctrlKey && !shiftKey) {
            this._clear(); // 点击屏幕->清除选中
          }
        },
        isMultiple: function () {
          return this.selected.length > 1;
        },
        sideBySide: function () {
          for (var i = this.selected.length; i > 0;) {
            if (this.selected[--i].parent !== this.ctrl.parent) return false;
          }
          return true;
        },
        forEachSelected: function (callback, context) {
          for (var i = 0, length = this.selected.length;
               i < length; i++) this._selected[i] = this.selected[i];
          for (i = 0; i < length; i++) callback.call(context, this._selected[i]);
        },
        onCtrlSelected: janvas.Utils.noop,
        onNodeSelected: janvas.Utils.noop,
        onClear: janvas.Utils.noop,
        _select: function (node) {
          node.select();
          this.selected.push(node);
          if (this.ctrl === null) this.onCtrlSelected(this.ctrl = node);
          else this.onNodeSelected(node);
        },
        _unselect: function (node) {
          node.unselect();
          this.selected.splice(this.selected.indexOf(node), 1);
        },
        _clear: function (except) {
          while (this.selected.length) this.selected.pop().unselect();
          this._shift.length = 0;
          this.ctrl = null;
          if (except) this._select(except);
          else this.onClear();
        },
        _selectRange: function (ctrl, node) {
          if (node.depth === ctrl.depth && node !== ctrl) {
            while (this._shift.length) {
              var pop = this._shift.pop();
              if (pop.isSelected) this._unselect(pop);
            }
            ctrl.parent.forEachChild(function (child) {
              if (!child.isSelected) this._select(child);
              this._shift.push(child);
            }, this, node.index, ctrl.index);
            if (!ctrl.isSelected) this._select(ctrl);
          }
        },
        get last() {
          return this.selected[this.selected.length - 1];
        },
        get length() {
          return this.selected.length;
        }
      };

      return Selector;
    }()),
    Hacker: (function () {
      Hacker.unit = "px";

      function Hacker() {
        this._init();
        this._initStyles();
        this._initCallbacks();
      }

      Hacker.prototype = {
        _init: function () {
          this.border = document.createElement("div");
          this.border.appendChild(this.textarea = document.createElement("textarea"));
          this.deactivate();
        },
        _initStyles: function () {
          var border = this.border.style, textarea = this.textarea.style;
          border.position = "absolute"; // border.display = "block";
          border.borderStyle = "solid";
          border.margin = "0";
          textarea.display = "block";
          textarea.overflow = "hidden";
          textarea.outline = textarea.border = textarea.resize = "none";
          textarea.wordWrap = textarea.whiteSpace = "break-spaces";
          textarea.wordBreak = "break-all";
          textarea.boxSizing = "border-box";
          textarea.margin = "0";
          textarea.tabSize = "1";
        },
        _initCallbacks: function () {
          var border = this.border;
          border.onmousedown = border.onmousemove = border.onmouseup =
            border.ontouchstart = border.ontouchmove = border.ontouchend =
              border.onmouseout = border.ontouchcancel = border.ondblclick = function (ev) {
                ev.stopPropagation();
              };
          border.oncontextmenu = function (ev) {
            ev.stopPropagation();
            ev.preventDefault(); // TODO: 使用 oncontextmenu(x, y) 回调出去，调用 Menu 菜单
          };
          border.onkeydown = function (ev) {
            var key = ev.key;
            if (this.isActivated()) {
              ev.stopPropagation();
              switch (key) {
                case "s":
                case "o":
                  if (ev.ctrlKey) ev.preventDefault();
                  break;
                case "Tab":
                  ev.preventDefault();
                  break;
                case "Escape":
                  this._bind.setValue(this._value);
                  this.deactivate();
                  break;
                case "Enter":
                  if (ev.ctrlKey) {
                    var value = this.getValue(), start = this.selectionStart,
                      end = this.selectionEnd;
                    this.setValue(value.substr(0, start) + "\n" + value.substr(end));
                    this.selectionEnd = start + 1;
                    this._oninput();
                  } else if (!ev.shiftKey) {
                    ev.preventDefault();
                    this.deactivate();
                  }
                  break;
              }
            } else if (!ev.ctrlKey && key.length === 1 || ev.isComposing || key === "Process") {
              if (key === " ") ev.preventDefault();
              ev.stopPropagation();
              this.activate();
            }
          }.bind(this);
          border.oninput = this._oninput.bind(this);
        },
        appendTo: function (wrapper) {
          wrapper.appendChild(this.border);
        },
        bind: function (node) {
          if (this.isActivated()) this.deactivate();
          this._bind = node;
          this.textarea.focus();
        },
        activate: function () {
          this.beforeActivate(this._bind);
          this._isActivated = true;
          this.border.style.opacity = "1";
          this.border.style.pointerEvents = "auto";
          this._bindParams();
          this._bindStyles();
          this._bind.hide();
          this.callDraw();
        },
        deactivate: function () {
          this._isActivated = false;
          this.border.style.opacity = "0";
          this.border.style.pointerEvents = "none";
          if (this._bind) {
            this._bind.show();
            if (this._bind.getValue() === this._value) this.callDraw();
            else this._bind.onValueOperation(this._value);
          }
        },
        isActivated: function () {
          return this._isActivated;
        },
        _bindParams: function () {
          this.follow();
          this.setWidth(this._bind.width);
          this.setHeight(this._bind.height);
          this.setValue(this._value = this._bind.getValue());
          this.textarea.select();
        },
        _bindStyles: function () {
          var border = this.border.style, textarea = this.textarea.style, bind = this._bind.style;
          border.borderRadius = bind.borderRadius + bind._borderOffset + Hacker.unit;
          border.padding = bind.borderPadding + Hacker.unit;
          border.borderWidth = bind.borderWidth + Hacker.unit;
          border.borderColor = bind.borderColor;
          textarea.backgroundColor = bind.backgroundColor;
          textarea.color = bind.color;
          textarea.font = bind.font; // textarea.fontFamily = bind.fontFamily; textarea.fontSize = bind.fontSize + Hacker.unit;
          textarea.lineHeight = bind.lineHeight + Hacker.unit;
          textarea.paddingTop = bind.paddingTop + bind.fontSize * 0.365 - bind.lineHeight / 2 + Hacker.unit;
          textarea.paddingLeft = bind.paddingLeft + Hacker.unit;
          textarea.paddingRight = bind.paddingRight + Hacker.unit;
          textarea.borderRadius = bind.borderRadius + Hacker.unit;
        },
        _oninput: function () {
          var bind = this._bind;
          bind.setValue(this.getValue());
          if (this.width < bind.width) this.setWidth(bind.width);
          if (this.height < bind.height) this.setHeight(bind.height);
          this.oninput(bind);
        },
        setStart: function (x, y) {
          this.border.style.left = (this.x = x) + Hacker.unit;
          this.border.style.top = (this.y = y) + Hacker.unit;
        },
        follow: function () {
          this.setStart(this._bind.borderX, this._bind.borderY);
        },
        setWidth: function (width) {
          this.textarea.style.width = (this.width = width) + Hacker.unit;
        },
        setHeight: function (height) {
          this.textarea.style.height = (this.height = height) + Hacker.unit;
        },
        getValue: function () {
          return this.textarea.value;
        },
        setValue: function (value) {
          this.textarea.value = value;
        },
        get selectionStart() {
          return this.textarea.selectionStart;
        },
        set selectionStart(selectionStart) {
          this.textarea.selectionStart = selectionStart;
        },
        get selectionEnd() {
          return this.textarea.selectionEnd;
        },
        set selectionEnd(selectionEnd) {
          this.textarea.selectionEnd = selectionEnd;
        },
        callDraw: janvas.Utils.noop,
        oninput: janvas.Utils.noop,
        beforeActivate: janvas.Utils.noop
      };

      return Hacker;
    }()),
    Operation: (function () {
      function Operation() {
        this._stack = [];
        this.clear();
      }

      Operation.prototype = {
        push: function (source, target, operation, newValue, reverse, oldValue) {
          this._pop();
          var now = performance.now();
          this._stack.push({
            source: source, target: target,
            operation: operation, newValue: newValue,
            reverse: reverse, oldValue: oldValue,
            immediate: now - this._timestamp < 10 // 小于 10 毫秒视为立即执行
          });
          this._timestamp = now;
          this._cursor++;
          this.onMove(source, target, operation);
        },
        prev: function () {
          if (this._cursor) {
            var peek = this._stack[--this._cursor];
            this._prev(peek); // this.onMove(peek.source, peek.target, peek.reverse);
            while (peek.immediate) this._prev(peek = this._stack[--this._cursor]);
          }
        },
        _prev: function (peek) {
          peek.source[peek.reverse](peek.target || peek.oldValue, peek.oldValue);
          this.onMove(peek.source, peek.target, peek.reverse);
        },
        next: function () {
          if (this._cursor < this._stack.length) {
            var peek = this._stack[this._cursor];
            this._next(peek);
            while (++this._cursor < this._stack.length
            && (peek = this._stack[this._cursor]).immediate) {
              this._next(peek); // peek = this._stack[this._cursor - 1];
            } // this.onMove(peek.source, peek.target, peek.operation);
          } // immediate 的操作若不回调 onMove，会影响多节点同时插入导致的样式设置问题
        }, // 解决办法可以是 this._style(this.root); 也可以是目前每次 onMove 都回调
        _next: function (peek) {
          peek.source[peek.operation](peek.target || peek.newValue, peek.newValue);
          this.onMove(peek.source, peek.target, peek.operation);
        },
        clear: function () {
          this._pop();
          this._stack.length = this._cursor = this._stamp = this._timestamp = 0;
        },
        _pop: function () {
          while (this._stack.length > this._cursor) {
            var peek = this._stack.pop();
            this.onPop(peek.source, peek.target, peek.operation);
          }
        },
        pause: function (pause) {
          this.push = pause ? janvas.Utils.noop : Operation.prototype.push;
        },
        hasChanged: function () {
          return this._cursor !== this._stamp;
        },
        stamp: function () {
          this._stamp = this._cursor;
        },
        onMove: janvas.Utils.noop,
        onPop: janvas.Utils.noop
      };

      return Operation;
    }())
  },
  methods: {
    init: function () {
      this._init();
      this._initStyles();
      this._initCallbacks();
      this._layout(this.root);
      this.selector.select(this.root);
    },
    _init: function () {
      this._garbage = [];
      this._arrowKey = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
      this._hotKey = ["Tab", "Enter", "Backspace", "Delete", "x", "c", "v", "d", "e"];
      this._queue = [];
      this._stack = [];
      this.background = new janvas.Rect(this.$ctx, 0, 0);
      this.selector = new this.Selector();
      this.hacker = new this.Hacker();
      this.hacker.appendTo(this.$wrapper);
      this.input = document.createElement("input");
      this.input.type = "file"; // this.input.multiple = false;
      this.operation = new this.Operation();
      this.root = this.parse(this.data);
      this.point.locate(this.$width / 2, this.$height / 2);
      this.point.animation = new janvas.Animation(
        this.$raf, 200, 0,
        function () { // beforeUpdate
          this._before.copy(this._offset);
        }.bind(this.point),
        function (ratio) { // onUpdate(ratio)
          var ease = janvas.Utils.ease.out.quad;
          this.set(this._before.x + this._delta.x * ease(ratio),
            this._before.y + this._delta.y * ease(ratio));
        }.bind(this.point),
        function () { // afterUpdate(forward)
          this.beforeUpdate();
        });
      this.box = new janvas.Rect(this.$ctx, 0, 0, 0, 0);
      this._nextDraw = janvas.Utils.nextTick(this.draw);
      this.imageData = new janvas.ImageData(this.$ctx, 0, 0);
    },
    _initStyles: function () {
      this.background.getStyle().setFillStyle(this.style.backgroundColor);
      this.box.getStyle().setFillStyle(this.style.boxBackgroundColor)
        .setStrokeStyle(this.style.boxBorderColor).setLineWidth(2);
      this._style(this.root);
    },
    _initCallbacks: function () {
      this.selector.onCtrlSelected = function (ctrl) {
        this.hacker.bind(ctrl);
        this._offsetToScreen(ctrl);
      }.bind(this);
      this.selector.onNodeSelected = function (node) {
        this._offsetToScreen(node);
        if (this.hacker.isActivated()) this.selector.select(node);
      }.bind(this);
      this.selector.onClear = function () {
        if (this.hacker.isActivated()) this.hacker.deactivate();
        else this._nextDraw();
      }.bind(this);
      this.hacker.callDraw = function () {
        this.draw();
      }.bind(this);
      this.hacker.oninput = function (bind) {
        this._offsetToScreen(bind,
          bind.right > this.$width || bind.bottom > this.$height);
      }.bind(this);
      this.hacker.beforeActivate = function (bind) {
        if (this.selector.isMultiple()) this.selector.select(bind);
      }.bind(this);
      this.input.onchange = function (ev) {
        this.load(ev.target.files.item(0));
        ev.target.value = "";
      }.bind(this);
      this.point.onOffsetChanged = function (x, y) {
        this._offset(x, y);
      }.bind(this);
      history.pushState(null, null, document.URL);
      window.addEventListener('popstate', function () {
        history.pushState(null, null, document.URL);
      }); // 阻止页面后退
      window.addEventListener("beforeunload", function (ev) {
        if (this.operation.hasChanged()) {
          ev.preventDefault(); // 提示页面即将关闭或刷新
          return ev.returnValue = "Are you sure you want to exit?";
        }
      }.bind(this), {capture: true});
      this.Node.setOnOperation(function () {
        this.operation.push.apply(this.operation, arguments);
      }.bind(this));
      this.operation.onMove = function (source, target, operation) {
        if (operation === this.Node.OPERATION.APPENDCHILD) this._style(target);
        this._layout(this.root);
        switch (operation) {
          case this.Node.OPERATION.APPENDCHILD:
            this.selector.select(target);
            break;
          case this.Node.OPERATION.REMOVECHILD:
            this.selector.select(target.index ? target.previous :
              target.parent.length ? target.parent.first : target.parent);
            break;
          case this.Node.OPERATION.COLLAPSE:
            this.selector.select(source);
            break;
          case this.Node.OPERATION.SETVALUE:
            this.draw();
            break;
        }
      }.bind(this);
      this.operation.onPop = function (source, target, operation) {
        if (operation === this.Node.OPERATION.APPENDCHILD) this._gc(target);
        else if (operation === this.Node.OPERATION.REMOVECHILD) this._release(target);
      }.bind(this);
    },
    _style: function (root) {
      var style = this.style;
      this._walk(root, function (node) {
        node.style.apply(node.depth > 1 ? style.subTopic :
          node.depth === 1 ? style.mainTopic : style.centralTopic);
        node.link.style.apply(node.depth ? style.mainLink : style.centralLink);
      });
    },
    _layout: function (root) { // TODO: 考虑累积偏移量最终一次性 layoutY
      root.layoutX = 0;
      root.layoutY = 0;
      if (this._layoutCheck(root)) this._layoutChildren(root);
      this._bfs(root, function (node) {
        node.beforeOffset();
        if (this._layoutCheck(node)) {
          var offset = node.cy - (node.first.cy + node.last.cy) / 2;
          node.forEachChild(function (child) { // offset 基本不可能为 0
            child.layoutY += offset;
          });
        }
      });
      this.point.add(0, 0);
    },
    _layoutCheck: function (node) {
      return node.length && !node.collapse;
    },
    _layoutChildren: function (root) {
      // if (root.length === 0 || root.collapse) return;
      var spacing, verticalSpacing, first = root.first, last = root.last,
        offset, layoutTop, layoutBottom;
      if (root.depth) {
        spacing = this.style.spacing;
        verticalSpacing = this.style.verticalSpacing;
      } else {
        spacing = this.style.centralSpacing;
        verticalSpacing = this.style.centralVerticalSpacing;
      }
      root.forEachChild(function (child) {
        child.layoutX = root.right + spacing;
        child.layoutY = child.index ? child.previous.bottom + verticalSpacing : 0;
      }); // 第一步骤：x 位移及顺序 y 布局
      offset = root.cy - (first.cy + last.cy) / 2;
      root.forEachChild(function (child) {
        child.layoutY += offset;
      }); // 第二步骤：计算中心点 offset，使节点均匀位移对应到父节点的中心点
      if (root.depth) {
        layoutTop = first.y - root.y;
        layoutBottom = last.bottom - root.bottom;
        if (layoutTop < 0) root.layoutTop = 0; // （关键）：在 root 已经顶出去的时候
        else root.layoutTop = -layoutTop, layoutTop = 0; // 记录下 -layoutTop/-layoutBottom
        if (layoutBottom > 0) root.layoutBottom = 0; // 而 root 没有顶出去的时候
        else root.layoutBottom = -layoutBottom, layoutBottom = 0; // 按照正常值顶出去
        if (layoutTop || layoutBottom) this._layoutParent(root, layoutTop, layoutBottom);
      } // 第三步骤：节点向上顶出去的值与向下顶出去的值给父节点的兄弟节点进行一个递归偏移
      root.forEachChild(function (child) {
        if (this._layoutCheck(child)) this._layoutChildren(child);
      }, this);
    },
    _layoutParent: function (node, layoutTop, layoutBottom) {
      var parent = node.parent, first = parent.first, last = parent.last,
        offset = first.y + last.bottom, layoutY = layoutTop;
      parent.forEachChild(function (child) {
        if (child === node) return layoutY = layoutBottom;
        child.layoutY += layoutY;
      }); // 第四步骤（关键）：顶出去的值会因为父节点的兄弟节点的不同导致有偏移量
      // 比如兄弟节点只有 previous，则只会向上顶，为了之后的向下偏移，两个偏移量均须 + offset
      if (parent.depth) {
        offset = (offset - (first.y + last.bottom)) / 2;
        layoutTop += offset;
        layoutBottom += offset;
        if (parent.layoutTop < 0) {
          if (parent.layoutTop < layoutTop) parent.layoutTop -= layoutTop, layoutTop = 0;
          else layoutTop -= parent.layoutTop, parent.layoutTop = 0;
        }
        if (parent.layoutBottom > 0) {
          if (parent.layoutBottom > layoutBottom) parent.layoutBottom -= layoutBottom, layoutBottom = 0;
          else layoutBottom -= parent.layoutBottom, parent.layoutBottom = 0;
        } // parent.layoutBottom 和 layoutBottom 都是减等于 Math.min(两者)
        this._layoutParent(parent, layoutTop, layoutBottom);
      }
    },
    _offset: function (x, y) { // 需要注意，此 _offset 绑定了 this.root
      var root = this.root;
      x -= root.width / 2;
      y -= root.height / 2;
      this._bfs(root, function (node) {
        node.offset(x, y);
        node.apply();
      });
      this._bfs(root, function (node) {
        node.link.apply();
      });
      if (this.hacker.isActivated()) this.hacker.follow();
    },
    _offsetToScreen: function (node, center) {
      var point = this.point, animation = point.animation,
        spacing = node.depth ? this.style.spacing : this.style.centralSpacing;
      if (!center && node.collidesWith(this.background)) {
        point.delta(
          node.right > this.$width ? this.$width - spacing - node.right :
            node.x < spacing ? spacing - node.x : 0,
          node.bottom > this.$height ? this.$height - spacing - node.bottom :
            node.y < spacing ? spacing - node.y : 0
        );
      } else {
        point.delta(this.$width / 2 - node.cx, this.$height / 2 - node.cy);
      }
      if (point.isDelta()) animation.start(); // 一般情况下的动画启动
      else if (animation.isRunning()) animation.beforeUpdate(), animation.stop(); // 当动画还在进行，但 delta 为 0 时的操作，锁定当前位置
      else if (center === void (0)) this._nextDraw(); // 其他无动画时的延迟下一帧绘制
    },
    resize: function () {
      this.background.setWidth(this.$width).setHeight(this.$height);
    },
    update: function (timestamp, interval) {
      this.point.animation.update(interval);
    },
    draw: function () {
      this.background.fill();
      this._bfs(this.root, function (node) {
        if (node.link.collidesWith(this.background)) node.link.draw();
        if (node.collidesWith(this.background)) node.draw();
      });
      this.box.fillStroke();
    },
    _walk: function (node, callback) {
      callback.call(this, node);
      node.forEachChild(function (child) {
        this._walk(child, callback);
      }, this);
    },
    _bfs: function (root, callback) { // BFS: BreadthFirstSearch
      var queue = this._queue, node;
      queue.unshift(root);
      while (queue.length) {
        callback.call(this, node = queue.shift());
        if (node.collapse) continue;
        node.forEachChild(function (child) {
          queue.push(child);
        });
      }
    },
    _dfs: function (root, callback) { // DeepFirstSearch
      var stack = this._stack, node, children, i;
      stack.push(root);
      while (stack.length) {
        callback.call(this, node = stack.pop());
        for (children = node.children, i = node.length; i > 0;) {
          stack.push(children[--i]);
        }
      }
    },
    _gc: function (node) {
      if (node._recursive) {
        delete node._recursive;
        this._gcRecursive(node);
      } else { // console.log(this._garbage.indexOf(node) === -1 ? "回收" : "忽略");
        this._garbage.push(node); // 由于 release 存在，在此 _garbage 一定不包含 node
      }
    },
    _release: function (node) { // console.log(index === -1 ? "忽略" : "释放");
      var index = this._garbage.indexOf(node);
      if (index !== -1) this._garbage.splice(index, 1);
    },
    _gcRecursive: function (root) {
      this._walk(root, function (node) {
        this._garbage.push(node);
      });
    },
    _gcNode: function (value, collapse) {
      var node = this._garbage.pop();
      node ? node.reset() : node = new this.Node(this.$ctx);
      node.value = value;
      node.collapse = !!collapse;
      return node;
    }
  },
  events: {
    eventdown: function (ev, type) {
      this.mouse.type = type;
      switch (type) {
        case this.mouse.left:
          this._eventmove(ev.$x, ev.$y);
          if (this._link) {
            ev.preventDefault();
            this._link.eventdown();
          } else {
            this.selector.select(this._node, ev.ctrlKey, ev.shiftKey);
            if (this._node || ev.ctrlKey || ev.shiftKey) {
              ev.preventDefault();
              if (this._node === this.root) this.point.eventdown();
            } else {
              this.$setCursor("default");
              this.box.setStart(ev.$x, ev.$y);
            }
          }
          break;
        case this.mouse.right:
          ev.preventDefault();
          this.$setCursor("grabbing");
          if (this.hacker.isActivated()) this.hacker.deactivate();
          this.point.eventdown();
          break;
      }
    },
    eventmove: janvas.Utils.nextTick(function (ev, type) {
      if (this.mouse.type !== type) return;
      switch (type) {
        case this.mouse.none:
          this._eventmove(ev.$x, ev.$y);
          break;
        case this.mouse.left:
          if (this._node) {
            if (this._node === this.root) {
              this.point.eventmove(ev.$moveX, ev.$moveY);
              this.draw();
            } else {
            }
          } else if (this._link === null && (ev.$moveX || ev.$moveY)) {
            this.box.setWidth(ev.$moveX).setHeight(ev.$moveY);
            this.selector.select(null);
            this._bfs(this.root, function (node) {
              if (node.collidesWith(this.box)) this.selector.select(node, true);
            });
          }
          break;
        case this.mouse.right:
          this.point.eventmove(ev.$moveX, ev.$moveY);
          this.draw();
          break;
      }
    }),
    _eventmove: function (x, y) {
      var node = this._node, link = this._link;
      this._node = this._link = null;
      this._bfs(this.root, function (node) {
        if (node.eventmove(x, y)) this._node = node;
        if (node.link.eventmove(x, y)) this._link = node.link;
      });
      if (node !== this._node || link !== this._link) {
        this.$setCursor(this._node || this._link ? "pointer" : "grab");
        this.draw();
      }
    },
    eventup: function () {
      this.mouse.type = this.mouse.none;
      if (this.$getCursor() !== "pointer") this.$setCursor("grab");
      if (this.box.getWidth() || this.box.getHeight()) {
        this.box.setWidth(0).setHeight(0);
        this.draw();
      }
    },
    keydown: function (ev) {
      ev.preventDefault();
      var key = ev.key;
      if (this._arrowKey.indexOf(key) !== -1) {
        if (ev.shiftKey) this._shiftArrow(key);
        else this._ctrlArrow(key, ev.ctrlKey);
      } else if (this._hotKey.indexOf(key) !== -1) {
        this._hotkey(key, ev.ctrlKey, ev.shiftKey);
      } else if (ev.ctrlKey) {
        this._hotkeyCtrl(key);
      }
    },
    _shiftArrow: function (key) {
      var selector = this.selector, ctrl = selector.ctrl, parent, previous;
      if (ctrl === null || (parent = ctrl.parent) === null) return;
      switch (key) {
        case "ArrowLeft":
          if (parent.depth) {
            parent.removeChild(ctrl);
            parent.parent.insertChild(ctrl, parent.index + 1);
          }
          break;
        case "ArrowRight":
          if (ctrl.index) {
            previous = ctrl.previous;
            parent.removeChild(ctrl);
            if (previous.collapse) previous.collapse = false;
            previous.appendChild(ctrl);
          }
          break;
        case "ArrowUp":
          if (ctrl.index) {
            parent.removeChild(ctrl);
            parent.insertChild(ctrl, ctrl.index - 1);
          }
          break;
        case "ArrowDown":
          if (ctrl.index + 1 < parent.length) {
            parent.removeChild(ctrl);
            parent.insertChild(ctrl, ctrl.index + 1);
          }
          break;
      }
    },
    _ctrlArrow: function (key, ctrlKey) {
      var selector = this.selector, last = selector.last,
        next, i, min = Infinity, dis, child;
      if (last === void (0)) return;
      switch (key) {
        case "ArrowLeft":
          next = last.parent;
          break;
        case "ArrowRight":
          if (last.collapse) return;
          for (i = 0; i < last.length; i++) {
            child = last.children[i];
            dis = Math.min(Math.abs(last.cy - child.y), Math.abs(last.cy - child.bottom));
            if (dis < min) min = dis, next = child;
            else break;
          }
          break;
        case "ArrowUp":
          if (last.index) {
            next = last.previous;
          } else if (last.depth > 1) {
            this._bfs(this.root, function (node) {
              if (last.y > node.y && last.x <= node.right && last.right >= node.x &&
                (dis = last.y - node.y) < min) min = dis, next = node;
            });
          }
          break;
        case "ArrowDown":
          if (last.index + 1 < (last.parent && last.parent.length)) {
            next = last.next;
          } else if (last.depth > 1) {
            this._bfs(this.root, function (node) {
              if (node.y > last.y && last.x <= node.right && last.right >= node.x &&
                (dis = node.y - last.y) < min) min = dis, next = node;
            });
          }
          break;
      }
      if (next) {
        if (ctrlKey && next.isSelected) selector.select(last, true), this.draw();
        else selector.select(next, ctrlKey);
      }
    },
    _hotkey: function (key, ctrlKey, shiftKey) {
      var selector = this.selector, ctrl = selector.ctrl, next, parent;
      if (ctrl === null) return;
      switch (key) {
        case "Tab":
          if (ctrl.collapse) ctrl.collapse = false;
          next = this._gcNode(this.topic(ctrl.depth) + (ctrl.length + 1));
          ctrl.appendChild(next);
          break;
        case "Enter":
          if ((parent = ctrl.parent) === null) return;
          if (ctrlKey) {
            if (selector.sideBySide()) {
              next = this._gcNode(this.topic(parent.depth) +
                (parent.length - selector.length + 1));
              selector.forEachSelected(function (selected) { // 以下等于 ctrl.index
                if (next.parent === null) parent.insertChild(next, selected.index);
                parent.removeChild(selected); // 以上不能写在 forEachSelected 之外的原因
                next.appendChild(selected); // 是因为 insertChild 会造成 select 操作
              });
            }
          } else {
            next = this._gcNode(this.topic(parent.depth) + (parent.length + 1));
            parent.insertChild(next, ctrl.index + !shiftKey);
          }
          break;
        case "Backspace":
        case "Delete": // TODO: 以后有空编写多节点删除等操作
          if ((parent = ctrl.parent) === null) return;
          if (ctrlKey) {
            if (ctrl.collapse) ctrl.collapse = false;
            while ((next = ctrl.first)) {
              ctrl.removeChild(next);
              parent.insertChild(next, ctrl.index);
            }
          }
          parent.removeChild(ctrl);
          break;
        case "x": // 剪切
          this._hotkey("c");
          this._hotkey("Delete");
          break;
        case "c": // 复制
          navigator.clipboard.writeText(this.serialize(ctrl, this.format.xmind));
          break;
        case "v": // 粘贴
          navigator.clipboard.readText().then(function (data) {
            next = this.deserialize(data, this.format.xmind);
            if (ctrl.collapse) ctrl.collapse = false;
            ctrl.appendChild(next);
          }.bind(this));
          break; // TODO: 复制和粘贴操作可以考虑进入 hacker 的逻辑，使用 execCommand 方式
        case "d":
          navigator.clipboard.writeText(this.serialize(ctrl, this.format.markdown));
          if ((parent = ctrl.parent) === null) return;
          navigator.clipboard.readText().then(function (data) {
            parent.insertChild(this.deserialize(data, this.format.markdown), ctrl.index + 1);
          }.bind(this));
          break;
        case "e": // Collapse & Expand
          if (ctrl.length) ctrl.collapse = !ctrl.collapse;
          break;
      }
    },
    _hotkeyCtrl: function (key) {
      switch (key) { // TODO: 以后有空编写搜索功能
        case "a": // 全选
          this.selector.select(this.root);
          var number = 0; // TODO: Delete
          this._bfs(this.root, function (node) {
            number++;
            this.selector.select(node, true);
          });
          this.selector.select(this.root, true);
          console.log("已选节点总数：" + number);
          break;
        case "q":
          this.selector.select(this.root);
          break;
        case "o": // open file
          if (this.operation.hasChanged() && confirm("需要保存您所做的更改吗？")) this._hotkeyCtrl("s");
          else this.input.click();
          break;
        case "s": // save file
          this.operation.stamp();
          this.save(); // TODO: 需要处理 Ctrl+S/O 的数据格式压缩问题
          break;
        case "S":
          this.saveAsImage(this.root);
          break;
        case "z":
          this.operation.prev();
          break;
        case "y":
        case "Z":
          this.operation.next();
          break;
      }
    },
    mousedown: function (ev) {
      this.eventdown(ev, ev.buttons);
    },
    mousemove: function (ev) {
      this.eventmove(ev, ev.buttons);
    },
    mouseup: function () {
      this.eventup();
    },
    dblclick: function () {
      if (this._link === null) {
        if (this._node) {
          this.selector.select(this._node);
          this.hacker.activate();
        } else {
          // TODO: 生成自由节点
          console.log(this._garbage.length === // TODO: Delete
          janvas.Utils.unique(this._garbage).length ?
            "垃圾回收系统正常" : "垃圾回收系统异常");
        }
      }
    },
    contextmenu: function (ev) { // TODO: 制作右键菜单栏

    },
    wheel: function (ev) {
      if (ev.ctrlKey) return;
      ev.preventDefault();
      ev.shiftKey ? this.point.add(-ev.deltaY, 0) : this.point.add(-ev.deltaX, -ev.deltaY);
      this.draw();
    },
    // TODO: 全局 blur 时节点边框颜色修改
    // touchstart: function (ev) { // TODO: 适配移动端
    // },
    // touchmove: function (ev) {
    // }
  },
  functions: {
    parse: function (data, parent) {
      if (parent === void (0)) parent = this._gcNode(data.value, data.collapse);
      for (var i = 0, children = data.children, length = children.length;
           i < length; i++) {
        var child = children[i], node = this._gcNode(child.value, child.collapse);
        parent.appendChild(node);
        this.parse(child, node);
      }
      return parent;
    },
    stringify: function (root, parent) {
      if (parent === void (0)) parent = {value: root.getValue(), children: []};
      if (root.collapse) parent.collapse = true;
      root.forEachChild(function (child) {
        var node = {value: child.getValue(), children: []};
        parent.children.push(node);
        this.stringify(child, node);
      }, this);
      return parent;
    },
    deserialize: function (data, format) {
      this.operation.pause(true);
      var lines = data.split(format.regex), length = lines.length, _indent = 0,
        root, cursor, line, indent, node, i;
      for (i = 0; i < length; i++) {
        line = lines[i];
        if (format.prefix) {
          indent = line.indexOf(format.prefix);
        } else {
          indent = 0;
          while (line.charAt(indent) === format.separate) indent++;
        }
        node = this._gcNode(line.substring(indent +
          format.prefix.length).replace(/\r\n/g, "\n"));
        if (indent) {
          if (indent > _indent) {
            _indent = indent;
          } else {
            cursor = cursor.parent;
            while (_indent > indent) {
              cursor = cursor.parent;
              _indent -= format.indent;
            }
          }
          cursor.appendChild(node);
        } else {
          root = node;
        }
        cursor = node;
      }
      this.operation.pause(false);
      root._recursive = true;
      return root;
    },
    serialize: function (root, format) {
      var result = "";
      this._walk(root, function (node) {
        result += format.separate.repeat((node.depth - root.depth) * format.indent)
          + format.prefix + node.value + format.suffix;
      });
      return result.substr(0, result.length - format.suffix.length);
    },
    saveAsImage: function (root) {
      var left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity, topNode;
      this._bfs(root, function (node) {
        if (node.x < left) left = node.x;
        if (node.y < top) top = node.y, topNode = node;
        if (node.right > right) right = node.right;
        if (node.bottom > bottom) bottom = node.bottom;
      });
      var padding = this.style.centralSpacing,
        offsetX = padding - root.x,
        offsetY = padding - topNode.y,
        width = padding * 2 + right - left,
        height = padding * 2 + bottom - top,
        dpr = this.$dpr;
      this.point.add(offsetX, offsetY);
      this.box.getMatrix().setOffset(offsetX, offsetY);
      this.$resize(width, height);
      this.imageData.setImageData(0, 0, width * dpr, height * dpr).saveAsImage(root.getValue(), "image/jpeg");
      this.point.add(-offsetX, -offsetY);
      this.box.getMatrix().setOffset(0, 0);
      this.$resize();
    },
    load: function (file) {
      if (file) {
        if (this._reader === void (0)) {
          this._reader = new FileReader();
          this._reader.onload = function (ev) {
            this._gcRecursive(this.root);
            this.operation.clear();
            this.operation.pause(true);
            this.root = this.parse(JSON.parse(ev.target.result));
            this.operation.pause(false);
            this._style(this.root); // 不绑定 parse 与 _style/_layout 的原因
            this._layout(this.root); // 一：可拓展性；二：_offset 是绑定了 this.root 的
            this.selector.select(this.root); // parse 过程中若 _layout，this.root 还没被赋值
          }.bind(this);
        }
        document.title = file.name;
        this._reader.readAsText(file);
      }
    },
    save: function () {
      var a = janvas.Utils._a,
        url = URL.createObjectURL(new Blob([JSON.stringify(this.stringify(this.root))],
          {type: "text/plain"}));
      a.href = url;
      a.download = document.title = this.root.getValue() + ".jmind";
      a.click();
      URL.revokeObjectURL(url);
    }
  },
  callbacks: {}
});
