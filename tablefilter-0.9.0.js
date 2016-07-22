/*
 * tablefilter.js
 * Version: 0.9.0
 *
 * (c) 2016 Marceau Dewilde
 * Licensed under Apache License v2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 */


var tablefilter = (function(){

	var counter = 0;
	var filterTimeout;
	
	
	
	var _init = function(callback) {
		_destroy();
		var list = document.querySelectorAll('[data-tablefilter]');
		for (var i = 0; i < list.length; ++i) {
			var filter = new _filter(list[i]);
			if (filter.valid) {
				if (typeof callback === 'function') {
					filter.callback = function() {callback()};
				} else {
					filter.callback = function() {};
				}
				filter.attach();
				filter.run();
			} else {
				_strip(list[i]);
			}
		}

	};
	
	var _destroy = function() {
		var nodes = document.querySelectorAll('[data-tablefilter-ids]');
		for (var i = 0; i < nodes.length; ++i) {
			nodes[i].removeAttribute('data-tablefilter-ids');
			nodes[i].style.display = 'table-row';
		}
		var filters = document.querySelectorAll('[data-tablefilter]');
		for (var i = 0; i < filters.length; ++i) {
			var filter = filters[i].tablefilter;
			if (filter && filter instanceof _filter) {
				filter.detach();
			}
			filters[i].tablefilter = undefined;
		}
		counter = 0;
	};
	
	/**
	 * Attach this filter's associated event(s)
	 */
	_filter.prototype.attach = function() {
		for (var i = 0; i < this.triggers.length; i++) {
			this.node.addEventListener(this.triggers[i], this.countdown);
		}
	};

	/**
	 * Remove this filter's associated event(s)
	 */
	_filter.prototype.detach = function() {
		for (var i = 0; i < this.triggers.length; i++) {
			this.node.removeEventListener(this.triggers[i], this.countdown);
		}
	};


	
	
	var _log = function(s) {
		'console' in window && console.log(s);
	};
	
	/**
	 * Test if the given argument is an HTML DOM element.
	 */
	var htmlElementSupported = (typeof HTMLElement === 'object');
	var _isNode = function(o) {
		if (!o) {
			return false;
		}
		if (htmlElementSupported) {
			return o instanceof HTMLElement; 
		} else {
			return typeof o === 'object' && 'tagName' in o;
		}
	};

	/**
	 * Strip all tablefilter attributes from the given node.
	 */
	var _strip = function(node) {
		if (_isNode(node)) {
			node.removeAttribute('data-tablefilter');
			node.removeAttribute('data-tablefilter-method');
			node.removeAttribute('data-tablefilter-id');
			node.removeAttribute('data-tablefilter-onclass');
			node.removeAttribute('data-tablefilter-byattribute');
		}
	};

//	/**
//	 * Toggle display of all rows that have received or lost filtering
//	 */
//	var _apply = function() {
//		var rows = document.querySelectorAll('[data-tablefilter-ids]');
//		for (var i = 0; i < rows.length; ++i) {
//			var ids = rows[i].getAttribute('data-tablefilter-ids');
//			if (ids && ids.trim().length) {
//				rows[i].style.display = 'none';
//		    } else {
//    	    	rows[i].style.display = 'table-row';
//		    }
//		}
//	};

	/**
	 * Check if a node has a specific class (case sensitive)
	 */
	var _hasClass = function(node, clazz) {
		return (' ' + node.className + ' ').indexOf(' ' + clazz + ' ') > -1;
	}

	/**
	 * Determine filter tag type
	 */
	var _parseType = function(node) {
		var tag = node.tagName.toLowerCase();
		if (tag === 'select') {
			return 'select';
		} else if (tag === 'textarea') {
			return 'input';
		} else if (tag === 'input') {
			var type = node.getAttribute('type');
			if (typeof type === 'string') {
				type = type.trim().toLowerCase();
			}
			if (type === 'button' || type === 'color' || type === 'file' || type === 'hidden' || type === 'image' || type === 'radio' || type === 'range' || type === 'submit') {
				_log(tag + ' is not supported');
				return false;
			} else if (type === 'checkbox') {
				return 'checkbox';
			} else {
				return 'input';
			}
		} else {
			_log(tag + ' is not supported');
			return false;
		}
	}

	/**
	 * Parse the data-tablefilter-toggle attribute
	 */
	var _parseToggle = function(node) {
		var toggle = node.getAttribute('data-tablefilter-toggle');
		if (!toggle || !toggle.length) {
			return 'tr';
		} else {
			return toggle.trim().toLowerCase();
		}
	}


	/* METHODS */
	
	/**
	 * Parse the data-tablefilter-method into appropriate function
	 */
	var _parseMethod = function(instance) {
		// the exact method is determined by hierarchy
		// as it is possible to add more than one attribute
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
	}
	
	_filter.prototype.methods = {
			
		/**
		 * Display all rows that contain a given value
		 */
		contain : function() {
			var rows = this.gather();
			var regExp = new RegExp(this.node.value, 'i');
			for (var i = 0; i < rows.length; i++) {
				if (this.extractor(rows[i]).search(regExp) > -1) {
					this.removeFilterId(rows[i]);
				} else {
					this.addFilterId(rows[i]);
				}
			}
		},
		
		/**
		 * Display all rows where filtered container has exact value
		 */
		exact : function() {
			var rows = this.gather();
			for (var i = 0; i < rows.length; i++) {
				if (this.extractor(rows[i]) === this.node.value) {
					this.removeFilterId(rows[i]);
				} else {
					this.addFilterId(rows[i]);
				}
			}
		},

		/**
		 * Display all rows that do not contain a given value
		 */
		exclude : function() {
			var regExp = new RegExp(this.node.value, 'i');
			var rows = this.gather();
			for (var i = 0; i < rows.length; i++) {
				if (this.extractor(rows[i]).search(regExp) > -1) {
					this.addFilterId(rows[i]);
				} else {
					this.removeFilterId(rows[i]);
				}
			}
		},

		/**
		 * Display all rows that that have a value equal to or greater than
		 */
		min : function() {
			var rows = this.gather();
			var min = this.node.value;
			if (!min || !min.length) {
				this.undo();
			}
			min = parseInt(min);
			if (typeof min !== 'number' || (min % 1) !== 0) {
				this.undo();				
			}
			for (var i = 0; i < rows.length; i++) {
				var int = this.extractInt(rows[i]);
				if (typeof int === 'number' && (int%1) === 0 && int >= min){
					this.removeFilterId(rows[i]);
				} else {
					this.addFilterId(rows[i]);
				}
			}
		},
		
		/**
		 * Display all rows that that have a value less than or equal to
		 */
		max : function() {
			var rows = this.gather();
			var max = this.node.value;
			if (!max || !max.length) {
				this.undo();
			}
			max = parseInt(max);
			if (typeof max !== 'number' || (max % 1) !== 0) {
				this.undo();				
			}
			for (var i = 0; i < rows.length; i++) {
				var int = this.extractInt(rows[i]);
				if (typeof int === 'number' && (int % 1) === 0 && int <= max) {
					this.removeFilterId(rows[i]);
				} else {
					this.addFilterId(rows[i]);
				}
			}
		}
			
	};
	
	/* EXTRACTORS */
	
	/**
	 * Determine which extractor logic to use for the given filter
	 */
	var _parseExtractor = function(instance) {
		
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
		
	}
	
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
			if (_hasClass(node)) {
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
	 * Collect all table rows that need to be evaluated by this filter
	 */
	_filter.prototype.gather = function() {
		var rows = [];
		var tables = document.querySelectorAll('table[data-tablefiltered]');
		for (var i = 0; i < tables.length; i++) {
			var trs = tables[i].getElementsByTagName('tr');
			for (var j = 0; j < trs.length; j++) {
				if (this.filtersRow(trs[j])) {
					rows.push(trs[j]);
				}
			}
		}
		return rows;
	};

	/**
	 * Evaluate whether the given row should be filtered by this filter
	 */
	_filter.prototype.filtersRow = function(tr) {
		var tds = tr.getElementsByTagName('td');
		if (tds.length > 0) {
			for (var i = 0; i < tds.length; i++) {
				if (this.isOnClass && !_hasClass(tds[i], this.onClass)) {
					continue;
				}
				return true;
			}
		}
		return false;
	};

	_filter.prototype.extractInt = function(node) {
		return parseInt(this.extractor(node));
	};

	_filter.prototype.isRemove = function() {
		if (this.type === 'checkbox') {
			return !this.node.checked;
		} else {
			return !this.node.value;
		}
	};
	
	/**
	 * Remove the effects of this filter
	 */
	_filter.prototype.undo = function() {
		var rows = this.gather();
		for (var i = 0; i < rows.length; i++) {
			this.removeFilterId(rows[i]);
		}
	};
	
	/**
	 * Removes this filter's id from the given row
	 */
	_filter.prototype.removeFilterId = function(row) {
//		row = this.getTagToToggle(tag);
//		if (!_isNode(row)) {
//			return false;
//		}
		var ids = row.getAttribute('data-tablefilter-ids');
		if (ids) {
			ids = ids.replace(this.id, '').trim();
			row.setAttribute('data-tablefilter-ids', ids);
			if (!ids.length) {
				row.style.display = 'table-row';
			}
		}
	};

	/**
	 * Removes this filter's id from the given row
	 */
	_filter.prototype.addFilterId = function(row) {
//		tag = this.getTagToToggle(tag);
//		if (!_isNode(tag)) {
//			return false;
//		}
		var ids = row.getAttribute('data-tablefilter-ids');
		if (!ids) {
			ids = this.id;
		} else if (ids.indexOf(this.id) === -1) {
			ids += ' ' + this.id;
		}
		if (ids.length) {
			row.style.display = 'none';
		}
		row.setAttribute('data-tablefilter-ids', ids);		
	};
	
//	_filter.prototype.getTagToToggle = function(tag) {
//		if (!_isNode(tag)) {
//			return false;
//		}
//		var tagName = tag.tagName.toLowerCase();
//		while (typeof tagName === 'string' && this.toggle !== tagName) {
//			tag = tag.parentNode;
//			if (_isNode(tag)) {
//				tagName = tag.tagName.toLowerCase();
//			} else {
//				tagName = null;
//			}
//			if (typeof tag === 'undefined' || tag === null) {
//				tagName = null;
//			} else {
//				tagName = tag.tagName.toLowerCase();
//			}
//		}
//		if (this.toggle === tagName) {
//			return tag;
//		} else {
//			return null;
//		}
//	};
//
//	
	
	/**
	 * Count down after triggering event occurred
	 */
	_filter.prototype.countdown = function() {
		if (filterTimeout) {
			clearTimeout(filterTimeout);
		}
		filterTimeout = setTimeout(function() {
			this.tablefilter.run();
		}.bind(this), 750);
	};
	
	_filter.prototype.run = function() {
		console.time('run');
		if (this.isRemove()) {
			this.undo();
		} else {
			this.method();
		}
		this.callback();
		console.timeEnd('run');
	};
	
	_filter.prototype.timeout = 750;
	_filter.prototype.valid = false;

	/**
	 * Constructor function for creating _filter instances.
	 * @param node : a plain JavaScript DOM element
	 */
	function _filter(node) {

		// type will be input, checkbox or select
		this.type = _parseType(node);
		if (!this.type) {
			return false;
		}

		this.node = node;
		
		// method will be contain, exclude, min or max
		this.method = _parseMethod(this);
		if (!this.method) {
			return false;
		}

		// the extractor determines which text this _filter will evaluate
		this.extractor = _parseExtractor(this);
		if (!this.extractor) {
			return false;
		}
		
		this.toggle = _parseToggle(node);

		if (!node.hasAttribute('data-tablefilter-id')) {
			node.setAttribute('data-tablefilter-id', '_' + (counter++) + '_');
		}
		this.id = node.getAttribute('data-tablefilter-id');

		
		if (this.type === 'checkbox') {
			if (!this.node.value || !this.node.value.length) {
				_log('checkbox should have a value to work properly with tablefilter')
				return false;
			}
			this.timeout = 50;
			this.triggers = ['change'];
		} else if (this.type === 'select') {
			this.timeout = 50;
			this.triggers = ['change','keyup'];
		} else {
			this.triggers = ['keyup'];
		}
		
		this.node.tablefilter = this;
		this.valid = true;
		
	}
	
	return _init;
	
})();
