/*
 * mfilter.js
 * Version: 0.9.0
 *
 * (c) 2016 Marceau Dewilde
 * Licensed under Apache License v2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var mfilter = (function(){

	var _init = function() {
		
		
	};
	
	
})():
$(function(){
	
	var mFilters = mFilter.init();

	for (prop in mFilter.mFilters) {
		if (mFilter.mFilters.hasOwnProperty(prop)) {
			mFilter.mFilters[prop].destroy()
		}
	}
});

mFilter.counter = 0;
mFilter.filterTimeout;
mFilter.mFilters;
/**
 * Find and prepare all mFilter instances for the current document.
 */
mFilter.init = function() {
	mFilter.mFilters = new Object();
	var list = document.querySelectorAll('[data-mfilter]');
	for (var i = 0; i < list.length; ++i) {
		var filter = new mFilter(list[i]);
		if (filter.valid) {
			mFilter.mFilters[filter.id] = filter;
			filter.run();
		} else {
			mFilter.strip(list[i]);
		}
	}
	return mFilter.mFilters;
};
/**
 * Test if the given argument is an HTML DOM element.
 */
mFilter.isTag = function(o) {
	if (typeof o === 'undefined' || o === null) {
		return false;
	}
	if (typeof HTMLElement === 'object') {
		return o instanceof HTMLElement; 
	} else {
		return typeof o === 'object' && typeof o.tagName === 'string';
	}
};
/**
 * Strips all mFilter attributes from the given tag.
 */
mFilter.strip = function(tag) {
	if (mFilter.isTag(tag)) {
		tag.removeAttribute('data-mfilter');
		tag.removeAttribute('data-mfilter-method');
		tag.removeAttribute('data-mfilter-id');
		tag.removeAttribute('data-mfilter-onclass');
		tag.removeAttribute('data-mfilter-byattribute');
	}
};

/**
 * Toggle the display of all items that have received or lost filtering.
 */
mFilter.apply = function() {
	var tags = document.querySelectorAll('[data-mfilter-ids]');
	for (var i = 0; i < tags.length; ++i) {
		var ids = tags[i].getAttribute('data-mfilter-ids');
		if (typeof ids === 'string' && ids.trim().length > 0) {
			tags[i].style.display = 'none';
	    } else {
	    	switch (tags[i].tagName.toLowerCase()) {
	    		case 'tr' : 
	    	    	tags[i].style.display = 'table-row';
	    			break;
	    		case 'td' : 
	    	    	tags[i].style.display = 'table-cell';
	    			break;
	    		default : 
	    	    	tags[i].style.display = 'block';
	    			break;
	    	}
	    }
	}
}
// TODO not used
mFilter.getNextId = function() {
	var next = 0;
	var list = document.querySelectorAll('[data-mfilter-id]');
	for (var i = 0; i < list.length; i++) {
		var id = list[i].getAttribute('data-mfilter-id');
		if (typeof id !== 'undefined' && id !== null) {
			var nId = parseInt(id.replace('_',''));
			if (nId !== NaN && next < nId) {
				next = nId;
			}
		}
	}
	return next + 1;
}

/**
 * Utility to check if a tag has a specific class.
 */
mFilter.hasClass = function(tag, clazz) {
	return (' ' + tag.className + ' ').indexOf(' ' + clazz + ' ') > -1;
}

/**
 * Detach the mFilter instance for the given tag, if any.
 */
mFilter.detach = function(tag) {
	if (!mFilter.isTag(tag)) {
		return null;
	}
	var id = tag.getAttribute('data-mfilter-id');
	if (typeof id === 'string' && id.length > 0) {
		var filter = mFilter.mFilters[id];
		if (typeof filter !== 'mFilter') {
			return false;
		}
		filter.destroy();
		console.log(filter);
		console.warn('mFilter: destroy TODO');
	}
}

//instance members
mFilter.prototype.countdown = function() {
	if (mFilter.filterTimeout) {
		clearTimeout(mFilter.filterTimeout);
	}
	mFilter.filterTimeout = setTimeout(function() {
		this.run();
	}.bind(this), 750);
};
mFilter.prototype.destroy = function() {
	this.undo();
	this.tag.removeEventListener(this.trigger, this.ontrigger);
	delete mFilter.mFilters[this.id];
};
mFilter.prototype.run = function() {
	if (this.isRemove()) {
		this.undo();
	} else {
		var val = this.tag.value;
		var tags = this.gather();

		if (this.method === 'contain') {
			var regExp = new RegExp(val, 'i');
			for (var i = 0; i < tags.length; i++) {
				if (this.extractText(tags[i]).search(regExp) > -1) {
					this.tagRemove(tags[i]);
				} else {
					this.tagAdd(tags[i]);
				}
			}
		} else if (this.method === 'exclude') {
			var regExp = new RegExp(val, 'i');
			for (var i = 0; i < tags.length; i++) {
				if (this.extractText(tags[i]).search(regExp) > -1) {
					this.tagAdd(tags[i]);
				} else {
					this.tagRemove(tags[i]);
				}
			}
		} else if (this.method === 'min') {
			for (var i = 0; i < tags.length; i++) {
				var int = this.extractInt(tags[i]);
				if (typeof int === 'number' && (int%1) === 0 && int >= val){
					this.tagRemove(tags[i]);
				} else {
					this.tagAdd(tags[i]);
				}
			}
		} else if (this.method === 'max') {
			for (var i = 0; i < tags.length; i++) {
				var int = this.extractInt(tags[i]);
				if (typeof int === 'number' && (int%1) === 0 && int <= val){
					this.tagRemove(tags[i]);
				} else {
					this.tagAdd(tags[i]);
				}
			}
		}
	}
	mFilter.apply();
}
/**
 * Collect all HTML elements that need to be evaluated by this filter.
 */
mFilter.prototype.gather = function() {
	var array = new Array();
	var tables = document.querySelectorAll('table[data-mfiltered]');
	for (var i = 0; i < tables.length; i++) {
		for (var j = 0; j < this.evaluate.length; j++) {
			var nodelist = tables[i].getElementsByTagName(this.evaluate[j]);
			for (var k = 0; k < nodelist.length; k++) {
				if (this.isOnClass && !mFilter.hasClass(nodelist[k], this.onClass)) {
					continue;
				}
				array.push(nodelist[k]);
			}
		}
	}
	return array;
}
mFilter.prototype.extractText = function(tag) {
	var string = '';
	if (this.isByAttribute) {
		var attribute = tag.getAttribute(this.byAttribute);
		if (typeof attribute === 'string') {
			string += attribute;
		}
	} else {
		string += tag.textContent;
	}
	return string;
}
mFilter.prototype.extractInt = function(tag) {
	return parseInt(this.extractText(tag));
}
mFilter.prototype.isRemove = function() {
	if (this.type === 'checkbox') {
		return !this.tag.checked;
	} else {
		return this.tag.value === null || this.tag.value.length === 0;
	}
};
mFilter.prototype.undo = function() {
	var list = document.querySelectorAll('tr[data-mfilter-tags]');
	for (var i = 0; i < list.length; ++i) {
		var ids = list[i].getAttribute('data-mfilter-tags');
		list[i].setAttribute('data-mfilter-tags', ids.replace(this.id, ''));
	}
	mFilter.apply();
};
mFilter.prototype.tagRemove = function(tag) {
	tag = this.getTagToToggle(tag);
	if (!mFilter.isTag(tag)) {
		return false;
	}
	if (tag.hasAttribute('data-mfilter-ids')) {
		var ids = tag.getAttribute('data-mfilter-ids');
		if (typeof ids === 'string') {
			tag.setAttribute('data-mfilter-ids', ids.replace(this.id, ''));
		}
	}
};
mFilter.prototype.tagAdd = function(tag) {
	tag = this.getTagToToggle(tag);
	if (!mFilter.isTag(tag)) {
		return false;
	}
	var ids = '';
	if (tag.hasAttribute('data-mfilter-ids')) {
		var r = tag.getAttribute('data-mfilter-ids');
		if (typeof r === 'string') {
			ids += r;
		}
	}
	if (ids.indexOf(this.id) < 0){
		tag.setAttribute('data-mfilter-ids', (ids + this.id).trim());
	}
};
mFilter.prototype.getTagToToggle = function(tag) {
	if (!mFilter.isTag(tag)) {
		return false;
	}
	var tagName = tag.tagName.toLowerCase();
	while (typeof tagName === 'string' && this.toggle !== tagName) {
		tag = tag.parentNode;
		if (mFilter.isTag(tag)) {
			tagName = tag.tagName.toLowerCase();
		} else {
			tagName = null;
		}
		if (typeof tag === 'undefined' || tag === null) {
			tagName = null;
		} else {
			tagName = tag.tagName.toLowerCase();
		}
	}
	if (this.toggle === tagName) {
		return tag;
	} else {
		return null;
	}
}

/**
 * Constructor function for creating mFilter instances.
 * @param tag : a plain JavaScript DOM element
 */
function mFilter(tag) {

	this.valid = false;

	if (!mFilter.isTag(tag)) {
		console.warn('mFilter: argument ' + tag + ' is not an element');
		return false;
	} else if (!tag.hasAttribute('data-mfilter')) {
		console.warn('mFilter: argument ' + tag + ' does not have the data-mfilter attribute');
		return false;
	}

	// type will be input, checkbox or select
	this.type = parseType(tag);
	if (this.type === null) {
		return false;
	}

	// the trigger that will be used to attach the filter event
	this.trigger = (this.type === 'checkbox' || this.type === 'select') ? 'change' : 'keyup';

	// method will be contain, exclude, min or max
	this.method = parseMethod(tag);
	if (this.method === null) {
		return false;
	}
	
	this.evaluate = parseEvaluate(tag);
	this.toggle = parseToggle(tag);

	// id will be set using counter on prototype
	if (!tag.hasAttribute('data-mfilter-id')) {
		tag.setAttribute('data-mfilter-id', '_' + (mFilter.counter++) + '_');
	}
	this.id = tag.getAttribute('data-mfilter-id');
	if (this.method === null) {
		return false;
	}
	
	// filter only inside elements with this class
	this.onClass = tag.getAttribute('data-mfilter-onclass');
	if (typeof this.onClass === 'undefined') {
		this.onClass = null;
	}
	this.isOnClass = this.onClass !== null;

	// filter on the contents of the given attribute, instead of element content
	this.byAttribute = tag.getAttribute('data-mfilter-byattribute');
	if (typeof this.byAttribute === 'undefined') {
		this.byAttribute = null;
	}
	this.isByAttribute = this.byAttribute !== null;

	this.tag = tag;
	
	this.valid = true;

	var _this = this;
	this.ontrigger = function() { _this.countdown(); };
	this.tag.addEventListener(this.trigger, this.ontrigger);

	/**
	 * Private constructor utility: determine the filter tag type
	 */
	function parseType(t) {
		var tagName = t.tagName.toLowerCase();
		if (tagName === 'select') {
			return 'select';
		} else if (tagName === 'textarea') {
			return 'input';
		} else if (tagName === 'input') {
			var type = t.getAttribute('type');
			if (typeof type !== 'undefined' && type) {
				type = type.trim().toLowerCase();
			}
			if (type === 'button' || type === 'color' || type === 'file' || type === 'hidden' || type === 'image' || type === 'radio' || type === 'range' || type === 'submit') {
				console.warn('mFilter: <input type="' + type + '"> is not supported');
				return null;
			} else if (type === 'checkbox') {
				return 'checkbox';
			} else {
				return 'input';
			}
		} else {
			console.warn('mFilter: <' + tagName + '> is not supported');
			return null;
		}
	}

	/**
	 * Private constructor utility: parse the data-mfilter-method attribute
	 */
	function parseMethod(t) {
		var method = t.getAttribute('data-mfilter-method');
		if (typeof method !== 'undefined' && method && method.length > 0) {
			method = method.trim().toLowerCase();
			switch (method) {
				case 'contain':
					return 'contain';
				case 'exclude':
					return 'exclude';
				case 'min':
					return 'min';
				case 'max':
					return 'max';
				default:
					console.warn('mFilter: <data-mfilter-method="' + method + '"> is not supported');
					return null;
			}
		} else {
			return 'contain';
		}
	}
	
	/**
	 * Private constructor utility: parse the data-mfilter-evaluate attribute
	 */
	function parseEvaluate(t) {
		var evaluate = t.getAttribute('data-mfilter-evaluate');
		if (typeof evaluate === 'undefined' || evaluate === null || evaluate.length === 0) {
			var array = new Array();
			array.push('td');
			return array;
		} else {
			return evaluate.trim().toLowerCase().split(' ');
		}
	}
	/**
	 * Constructor utility: parse the data-mfilter-toggle attribute
	 */
	function parseToggle(t) {
		var toggle = t.getAttribute('data-mfilter-toggle');
		if (typeof toggle === 'undefined' || toggle === null || toggle.length === 0) {
			return 'tr';
		} else {
			return toggle.trim().toLowerCase();
		}
	}

	if (typeof Object.freeze === 'function') {
		Object.freeze(this);
	}

}
