/*
 * tablefilter.js
 * Version: 0.9.0
 *
 * (c) 2016 Marceau Dewilde
 * Licensed under Apache License v2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 */


var tablefilter = (function(){

	var filters = {};
	var htmlElementSupported = (typeof HTMLElement === 'object');
	var counter = 0;
	var filterTimeout;
	
	
	var _log = function(s) {
		'console' in window && console.log(s);
	};
	
	var _init = function() {

		var list = document.querySelectorAll('[data-tablefilter]');
		for (var i = 0; i < list.length; ++i) {
			var filter = new Filter(list[i]);
			if (filter.valid) {
				filters[filter.id] = filter;
				filter.run();
			} else {
				_strip(list[i]);
			}
		}

	};
	
	/**
	 * Test if the given argument is an HTML DOM element.
	 */
	var _isNode = function(o) {
		if (!o) {
			return false;
		}
		if (htmlElementSupported) {
			return o instanceof HTMLElement; 
		} else {
			return typeof o === 'object' && typeof o.tagName === 'string';
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

	/**
	 * Toggle display of all rows that have received or lost filtering
	 */
	var _apply = function() {
		var rows = document.querySelectorAll('[data-tablefilter-ids]');
		for (var i = 0; i < rows.length; ++i) {
			var ids = rows[i].getAttribute('data-tablefilter-ids');
			if (ids && ids.trim().length) {
				rows[i].style.display = 'none';
		    } else {
    	    	rows[i].style.display = 'table-row';
		    }
		}
	};

	/**
	 * Check if a node has a specific class (case sensitive)
	 */
	var _hasClass = function(node, clazz) {
		return (' ' + node.className + ' ').indexOf(' ' + clazz + ' ') > -1;
	}

	/**
	 * Detach the tablefilter instance for the given node, if any
	 */
	var _detach = function(node) {
		if (!_isNode(node)) {
			return false;
		}
		var id = node.getAttribute('data-tablefilter-id');
		if (id) {
			var filter = filters[id];
			if (typeof filter !== 'tablefilter') {
				return false;
			}
			filter.destroy();
			console.log(filter);
			_log('tablefilter: destroy TODO');
		}
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
		if (typeof toggle === 'undefined' || toggle === null || toggle.length === 0) {
			return 'tr';
		} else {
			return toggle.trim().toLowerCase();
		}
	}

	/**
	 * Parse the data-tablefilter-method into appropriate function
	 */
	var _parseMethod = function(instance, node) {
		var method = node.getAttribute('data-tablefilter-method');
		if (method && method.length) {
			method = method.trim().toLowerCase();
			switch (method) {
				case 'contain':
					return instance.methods.contain;
				case 'exclude':
					return instance.methods.exclude;
				case 'min':
					return instance.methods.min;
				case 'max':
					return instance.methods.max;
				default:
					_log('filter.methods._parse() : ' + method + ' method is not supported');
					return false;
			}
		} else {
			return instance.methods.contain;
		}
	}
	
	/**
	 * Count down after triggering event occurred
	 */
	Filter.prototype.countdown = function() {
		if (filterTimeout) {
			clearTimeout(filterTimeout);
		}
		filterTimeout = setTimeout(function() {
			this.run();
		}.bind(this), 750);
	};
	
	/**
	 * Remove this filter and its associated events
	 */
	Filter.prototype.destroy = function() {
		this.undo();
		this.node.removeEventListener(this.trigger, this.ontrigger);
		delete filters[this.id];
	};
	
	
	/**
	 * Define method logic
	 */
	Filter.prototype.methods = {};
	
	/**
	 * Display all rows that contain a given value
	 */
	Filter.prototype.methods.contain = function() {
		var rows = this.gather();
		var regExp = new RegExp(this.node.value, 'i');
		for (var i = 0; i < rows.length; i++) {
			if (this.extractText(rows[i]).search(regExp) > -1) {
				this.removeFilterId(rows[i]);
			} else {
				this.addFilterId(rows[i]);
			}
		}
	};
	
	/**
	 * Display all rows that do not contain a given value
	 */
	Filter.prototype.methods.exclude = function() {
		var regExp = new RegExp(this.node.value, 'i');
		var rows = this.gather();
		for (var i = 0; i < rows.length; i++) {
			if (this.extractText(rows[i]).search(regExp) > -1) {
				this.addFilterId(rows[i]);
			} else {
				this.removeFilterId(rows[i]);
			}
		}
	};

	/**
	 * Display all rows that that have a value equal to or greater than
	 */
	Filter.prototype.methods.min = function() {
		var rows = this.gather();
		for (var i = 0; i < rows.length; i++) {
			var int = this.extractInt(rows[i]);
			if (typeof int === 'number' && (int%1) === 0 && int >= val){
				this.removeFilterId(rows[i]);
			} else {
				this.addFilterId(rows[i]);
			}
		}
	};
	
	/**
	 * Display all rows that that have a value less than or equal to
	 */
	Filter.prototype.methods.max = function() {
		var rows = this.gather();
		for (var i = 0; i < rows.length; i++) {
			var int = this.extractInt(rows[i]);
			if (typeof int === 'number' && (int%1) === 0 && int <= val){
				this.removeFilterId(rows[i]);
			} else {
				this.addFilterId(rows[i]);
			}
		}
	};
	
	Filter.prototype.run = function() {
		console.time('run');
		if (this.isRemove()) {
			this.undo();
		} else {
			this.method();
		}
	//	_apply();
		console.timeEnd('run');
	};
	

	/**
	 * Collect all table rows that need to be evaluated by this filter
	 */
	Filter.prototype.gather = function() {
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
	Filter.prototype.filtersRow = function(tr) {
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

	/**
	 * Extract the text against which to run this filter
	 */
	Filter.prototype.extractText = function(tr) {
		if (!this.isByAttribute) {
			return tr.textContent;
		}
		var es = [].slice.call(tr.getElementsByTagName('*'));
		es.push(tr);
		var s = '';
		for (var i = 0; i < es.length; i++) {
			var attr = es[i].getAttribute(this.byAttribute);
			if (attr) {
				s += attr;
			}
		}
		return s;
	};

	Filter.prototype.extractInt = function(tag) {
		return parseInt(this.extractText(tag));
	};
	Filter.prototype.isRemove = function() {
		if (this.type === 'checkbox') {
			return !this.node.checked;
		} else {
			return !this.node.value;
		}
	};
	
	/**
	 * Remove the effects of this filter
	 */
	Filter.prototype.undo = function() {
		var rows = this.gather();
		for (var i = 0; i < rows.length; i++) {
			this.removeFilterId(rows[i]);
		}
	};
	
	Filter.prototype.removeFilterId = function(row) {
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
	Filter.prototype.addFilterId = function(row) {
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
	
//	Filter.prototype.getTagToToggle = function(tag) {
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
	 * Constructor function for creating Filter instances.
	 * @param node : a plain JavaScript DOM element
	 */
	function Filter(node) {

		this.valid = false;

		if (!_isNode(node)) {
			_log('tablefilter: argument ' + node + ' is not an element');
			return false;
		} else if (!node.hasAttribute('data-tablefilter')) {
			_log('tablefilter: argument ' + node + ' does not have the data-tablefilter attribute');
			return false;
		}

		if (document.querySelectorAll('table[data-tablefiltered]').length === 0) {
			_log('tablefilter is intended to filter a table with attribute data-tablefiltered - such a table does not currently appear in the DOM');
		}
		
		// type will be input, checkbox or select
		this.type = _parseType(node);
		if (!this.type) {
			return false;
		}

		// the trigger that will be used to attach the filter event
		this.trigger = (this.type === 'checkbox' || this.type === 'select') ? 'change' : 'keyup';

		// method will be contain, exclude, min or max
		this.method = _parseMethod(this, node);
		if (!this.method) {
			return false;
		}

		this.toggle = _parseToggle(node);

		if (!node.hasAttribute('data-tablefilter-id')) {
			node.setAttribute('data-tablefilter-id', '_' + (counter++) + '_');
		}
		this.id = node.getAttribute('data-tablefilter-id');
		if (this.method === null) {
			return false;
		}
		
		// filter only inside elements with this class
		this.onClass = node.getAttribute('data-tablefilter-onclass');
		if (typeof this.onClass === 'undefined') {
			this.onClass = null;
		}
		this.isOnClass = this.onClass !== null;

		// filter on the contents of the given attribute, instead of element content
		this.byAttribute = node.getAttribute('data-tablefilter-byattribute');
		if (typeof this.byAttribute === 'undefined') {
			this.byAttribute = null;
		}
		this.isByAttribute = this.byAttribute !== null;

		this.node = node;
		
		this.valid = true;

		var self = this;
		this.ontrigger = function() { self.countdown(); };
		this.node.addEventListener(this.trigger, this.ontrigger);
		
		
//	    var key = event.keyCode || event.charCode;
//
//	    if( key == 8 || key == 46 )
//	        return false;
//		this.node.addEventListener('change', function() {_log('change');});
//		this.node.addEventListener('keydown', function() {_log('keydown');});


	}
	
	return _init;
	
})();
