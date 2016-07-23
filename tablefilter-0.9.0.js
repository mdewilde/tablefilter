/*
 * tablefilter.js
 * Version: 0.9.0
 *
 * (c) 2016 Marceau Dewilde
 * Licensed under Apache License v2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 */


var tablefilter = (function(){

	/**
	 * Constructor for internal _filter instances.
	 */
	var _filter = function(node) {

		this.presets = _filter.getPresets(node);
		if (!this.presets) {
			return false;
		}

		this.node = node;

		// method will be contain, exclude, min or max
		this.method = _filter.parseMethod(this);
		if (!this.method) {
			return false;
		}

		// the extractor determines which text this _filter will evaluate
		this.extractor = _filter.parseExtractor(this);
		if (!this.extractor) {
			return false;
		}
		
		if (!node.hasAttribute('data-tablefilter-id')) {
			node.setAttribute('data-tablefilter-id', '_' + (_filter.counter++) + '_');
		}
		this.id = node.getAttribute('data-tablefilter-id');

		this.node.tablefilter = this;
		this.valid = true;
		
	};
	
	/**
	 * Attach this filter's associated event(s)
	 */
	_filter.prototype.attach = function() {
		for (var i = 0; i < this.presets.triggers.length; i++) {
			this.node.addEventListener(this.presets.triggers[i], this.countdown);
		}
	};

	/**
	 * Remove this filter's associated event(s)
	 */
	_filter.prototype.detach = function() {
		for (var i = 0; i < this.presets.triggers.length; i++) {
			this.node.removeEventListener(this.presets.triggers[i], this.countdown);
		}
	};
	
	/* METHODS */
	
	_filter.parseMethod = function(instance) {
		// the exact method is determined in hierarchy
		if (instance.node.hasAttribute('data-tablefilter-contain')) {
			return instance.methods.contain;
		}
		if (instance.node.hasAttribute('data-tablefilter-exact')) {
			return instance.methods.exact;
		}
		if (instance.node.hasAttribute('data-tablefilter-exclude')) {
			return instance.methods.exclude;
		}
		if (instance.node.hasAttribute('data-tablefilter-min')) {
			return instance.methods.min;
		}
		if (instance.node.hasAttribute('data-tablefilter-max')) {
			return instance.methods.max;
		}
		return instance.methods.contain;
	};
	
	_filter.prototype.methods = {
			
		/**
		 * Display row if filtered text contains given value
		 */
		contain : function(row, value) {
			if (this.extractor(row).search(value.regEx) > -1) {
				this.show(row);
			} else {
				this.hide(row);
			}
		},
		
		/**
		 * Display row if filtered text is exact value
		 */
		exact : function(row, value) {
			if (this.extractor(row) === value.raw) {
				this.show(row);
			} else {
				this.hide(row);
			}
		},

		/**
		 * Display row if filtered text does not contain given value
		 */
		exclude : function(row, value) {
			if (this.extractor(row).search(value.regEx) > -1) {
				this.hide(row);
			} else {
				this.show(row);
			}
		},

		/**
		 * Display row if filtered value is equal to or greater than
		 */
		min : function(row, value) {
			var v = this.extractor(row);
			if (v && v.length) {
				v = v.toLowerCase();
				if (v >= value.lowercase) {
					this.show(row);
					return;
				}
			}
			this.hide(row);
		},
		
		/**
		 * Display row if filtered value is less than or equal to
		 */
		max : function(row, value) {
			var v = this.extractor(row);
			if (v && v.length) {
				v = v.toLowerCase();
				if (v <= value.lowercase) {
					this.show(row);
					return;
				}
			}
			this.hide(row);
		}

	};

	/**
	 * Take input value and prepare parsed object for use with action callback
	 */
	_filter.prototype.prepareValue = function() {
		if (!this.node.value) {
			return false;
		}
		return {
			raw : this.node.value,
			regEx : new RegExp(this.node.value, 'i'),
			lowercase : this.node.value.toLowerCase()
		};
	};
	
	/**
	 * Do the actual filtering of table rows.
	 * action callback determines filter behavior.
	 */
	_filter.prototype.filter = function() {
		var value = this.prepareValue();
		if (!value) {
			return false;
		}
		var tables = document.getElementsByTagName('table');
		for (var i = 0; i < tables.length; i++) {
			if (!tables[i].hasAttribute('data-tablefiltered')) {
				continue;
			}
			var rows = tables[i].getElementsByTagName('tr');
			for (var j = 0; j < rows.length; j++) {
				if (rows[j].getElementsByTagName('td').length > 0) {
					this.method(rows[j], value);
				}
			}
		}
	};
	
	/* EXTRACTORS */
	
	_filter.parseExtractor = function(instance) {
		
		// filter only inside elements with this class
		instance.clazz = instance.node.getAttribute('data-tablefilter-onclass');
		instance.attr = instance.node.getAttribute('data-tablefilter-byattribute');

		if (instance.clazz) {
			if (instance.attr) {
				return instance.extractors.attrInClass;
			} else {
				return instance.extractors.textInClass;
			}
		} else if (instance.attr) {
			return instance.extractors.attr;
		} else {
			return instance.extractors.text;
		}
		
	};
	
	_filter.prototype.extractors = {

		/**
		 * Extract the full text content of the node (and all descendants)
		 */
		text : function(node) {
			return node.textContent;
		},

		/**
		 * Extract the text content of the node and/or any descendants with clazz
		 */
		textInClass : function(node) {
			if (_filter.hasClass(node)) {
				return node.textContent;
			}
			var string = '';
			var nodes = node.getElementsByClassName(this.clazz);
			for (var i = 0; i < nodes.length; i++) {
				string += nodes[i].textContent;
			}
			return string;
		},
		
		/**
		 * Extract the value of attr from this node and any descendant with attr
		 */
		attr : function(node) {
			var nodes = [].slice.call(node.getElementsByTagName('*'));
			nodes.push(node);
			var string = '';
			for (var i = 0; i < nodes.length; i++) {
				var attr = nodes[i].getAttribute(this.attr);
				if (attr) {
					string += attr;
				}
			}
			return string;
		},
		
		/**
		 * Extract the value of attr from this node and/or any descendant with attr and clazz
		 */
		attrInClass : function(node) {
			var string = node.getAttribute(this.attr) || '';
			var nodes = [].slice.call(node.getElementsByClassName(this.clazz));
			for (var i = 0; i < nodes.length; i++) {
				var attr = nodes[i].getAttribute(this.attr);
				if (attr) {
					string += attr;
				}
			}
			return string;
		}
		
	};
	
	/**
	 * Remove this filter's id from the given row.
	 * Reveal the row if no other filters are active on it.
	 */
	_filter.prototype.show = function(row) {
		var ids = row.getAttribute('data-tablefilter-ids');
		if (ids) {
			ids = ids.replace(this.id, '');
			row.setAttribute('data-tablefilter-ids', ids);
			if (!ids.length) {
				row.style.display = 'table-row';
			}
		}
	};
		
	/**
	 * Add this filter's id to the given row.
	 * Hide the row.
	 */
	_filter.prototype.hide = function(row) {
		var ids = row.getAttribute('data-tablefilter-ids');
		if (!ids) {
			ids = this.id;
		} else if (ids.indexOf(this.id) === -1) {
			ids += this.id;
		}
		row.setAttribute('data-tablefilter-ids', ids);		
		if (ids.length) {
			row.style.display = 'none';
		}
	};

	/**
	 * Evaluate whether we should undo the filter's effects based on the node's
	 * current value
	 */
	_filter.prototype.isUndo = function() {
		if (this.presets.type === 'checkbox') {
			return !this.node.checked;
		} else {
			return !this.node.value;
		}
	};
	
	/**
	 * Remove the effects of this filter
	 */
	_filter.prototype.undo = function() {
		var rows = document.getElementsByTagName('tr');
		for (var i = 0; i < rows.length; i++) {
			this.show(rows[i]);
		}
	};
	
	/**
	 * Count down after triggering event occurred
	 */
	_filter.prototype.countdown = function() {
		if (this.tablefilter.filterTimeout) {
			clearTimeout(this.tablefilter.filterTimeout);
		}
		this.tablefilter.filterTimeout = setTimeout(function() {
			this.tablefilter.run();
		}.bind(this), this.tablefilter.presets.timeout);
	};
	
	_filter.prototype.run = function() {
		console.time('run');
		if (this.isUndo()) {
			this.undo();
		} else {
			this.filter();
		}
		_filter.callback();
		console.timeEnd('run');
	};

	_filter.counter = 0;
	
	_filter.callback = function() {};
	
	_filter.destroy = function() {
		var nodes = document.querySelectorAll('[data-tablefilter-ids]');
		for (var i = 0; i < nodes.length; ++i) {
			nodes[i].removeAttribute('data-tablefilter-ids');
			nodes[i].style.display = 'table-row';
		}
		var filters = document.querySelectorAll('[data-tablefilter]');
		for (var j = 0; j < filters.length; ++j) {
			var filter = filters[j].tablefilter;
			if (filter && filter instanceof _filter) {
				filter.detach();
			}
			filters[j].tablefilter = undefined;
		}
		_filter.counter = 0;
	};
	
	/**
	 * Strip all tablefilter attributes from the given node.
	 */
	_filter.strip = function(node) {
		if (typeof node === 'object' && 'removeAttribute' in node) {
			node.removeAttribute('data-tablefilter');
			node.removeAttribute('data-tablefilter-id');
			node.removeAttribute('data-tablefilter-contain');
			node.removeAttribute('data-tablefilter-exact');
			node.removeAttribute('data-tablefilter-exclude');
			node.removeAttribute('data-tablefilter-min');
			node.removeAttribute('data-tablefilter-max');
			node.removeAttribute('data-tablefilter-onclass');
			node.removeAttribute('data-tablefilter-byattribute');
		}
	};

	/**
	 * Check if a node has a specific class (case sensitive)
	 */
	_filter.hasClass = function(node, clazz) {
		return (' ' + node.className + ' ').indexOf(' ' + clazz + ' ') > -1;
	};

	/**
	 * Determine filter tag type
	 */
	_filter.getPresets = function(node) {
		var tag = node.tagName.toLowerCase();
		if (tag === 'select') {
			return {
				type : 'select',
				timeout : 50,
				triggers : [ 'change', 'keyup' ]
			};
		} else if (tag === 'textarea') {
			return {
				type : 'input',
				timeout : 500,
				triggers : [ 'keyup' ]
			};
		} else if (tag === 'input') {
			var type = node.getAttribute('type');
			if (typeof type === 'string') {
				type = type.trim().toLowerCase();
			}
			if (type === 'button' || type === 'submit') {
				return false;
			}
			if (type === 'color' || type === 'file' || type === 'hidden' || type === 'image') {
				return false;
			}
			if (type === 'radio' || type === 'range') {
				// TODO add behavior for these
				return false;
			}
			if (type === 'checkbox') {
				if (!node.value || !node.value.length) {
					return false;
				}
				return {
					type : 'checkbox',
					timeout : 50,
					triggers : [ 'change' ]
				};
			} else {
				return {
					type : 'input',
					timeout : 500,
					triggers : [ 'keyup' ]
				};
			}
		} else {
			return false;
		}
	};

	_filter.init = function(callback) {
		_filter.destroy();
		if (typeof callback === 'function') {
			_filter.callback = callback;
		}
		var list = document.querySelectorAll('[data-tablefilter]');
		for (var i = 0; i < list.length; ++i) {
			var filter = new _filter(list[i]);
			if (filter.valid) {
				filter.attach();
				filter.run();
			} else {
				_filter.strip(list[i]);
			}
		}
	};
	
	return _filter.init;
	
})();
