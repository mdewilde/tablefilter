# tablefilter

`tablefilter` is a JavaScript library for fast and powerful filtering of HTML tables.

`tablefilter` is written in plain JavaScript and has no external dependencies.

`tablefilter` uses [querySelectorAll](https://developer.mozilla.org/nl/docs/Web/API/Document/querySelectorAll). If older browser are part of your target audience, do verify compatibility at [caniuse](http://caniuse.com/#feat=queryselector).

### Demo
		
A demo with a number of use cases can be found [here](http://www.ceau.be/tablefilter/demo.html).

### Usage

The attribute `data-tablefilter` goes on any `input`, `textarea` or `select` element that will be a filter.

The attribute `data-tablefiltered` goes on any `table` that will be filtered.

To load the `tablefilter`, simply call

```javascript
tablefilter();
```

It is also possible to initialize the `tablefilter` with a callback function, which will be called each time a filter is changed.

```javascript
tablefilter(callback);
```

By default, `tablefilter` displays all rows that contain the value of the filter. Matching is case-insensitive.
		
Filtering **behavior** can be adjusted using any of the following attributes:

* `data-tablefilter-contain`: filtered text must contain the value of the filter
* `data-tablefilter-exact`: filtered text must exactly match the value of the filter
* `data-tablefilter-exclude`: filtered text must not contain the value of the filter
* `data-tablefilter-min`: filtered text must be a number equal to or larger than the value of the filter
* `data-tablefilter-max`: filtered text must be a number smaller than or equal to the value of the filter

If more than one of these attributes is added to an `input`, `textarea` or `select`, only one behavior will be honored. 
The hierarchy of these attributes is as they appear above. If, for example, both `data-tablefilter-contain` and `data-tablefilter-exclude` appear on the same `input`, the honored behavior will be `data-tablefilter-contain`.

Filtering **scope** can be adjusted using any of the following attributes:

* `data-tablefilter-onclass`: filter only text found in elements that have the name class
* `data-tablefilter-byattribute`: filter on the value of the attribute in all considered elements

`tablefilter` should be (re)initialized any time a filtering `input`, `textarea` or `select` element is added to the DOM.

It is not necessary that targeted `table` elements are already part of the DOM on `tablefilter` initialization.

### Source code

Source code is available on [GitHub](https://github.com/mdewilde/tablefilter).

### Download
Download this project
* [tablefilter-0.9.0.js](https://www.ceau.be/tablefilter/tablefilter-0.9.0.js)
* [tablefilter-0.9.0.min.js](https://www.ceau.be/tablefilter/tablefilter-0.9.0.min.js)

### License
`tablefilter` is licensed under [the Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0.txt).
