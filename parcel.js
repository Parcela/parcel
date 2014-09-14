"use strict";
/**
@module core
@submodule parcel
*/
require('lang-ext');
/**
All Parcela apps should inherit from this class.

The constructor ensures the `config` argument exists and is an object.
It merges the values from the [`defaultConfig`](#property_defaultConfig) property into it and
sets the properties of the instance to the resulting values.
It then calls the `init` method with all its arguments.
The [`init`](#method_init) might be considered the true constructor of the parcel.



@class Parcel
@constructor
*/
var Parcel = Object.createClass(function (config) {
	config = Object.merge(config, this.defaultConfig);
	this.merge(config);
	// fastest way, according to http://jsperf.com/concatenating
	var a = Array.prototype.slice.call(arguments, 1);
	a.unshift(config);
	this.init.apply(this, a);
},{
	/**
	Provides the initialization of the parcel, called by the constructor of the parcel with all its arguments.

	The provided method is empty, it can be overriden by each Parcela app.

	Set up event listeners, initialize variables and models and prepare for operation.
	@method init
	*/
	init: function (config) {},


	/**
	Destructor.  

	The provided method checks all the instance properties and if any of them are 
	instances of Parcel, it will call the `destroy` method on each of the child parcels.

	@method destroy
	*/
	destroy: function () {
		this.each(function (member) {
			if (member instanceof Parcel) member.destroy.call(this);
		}, this);
	},

	/**
	Called by the renderer before this Parcel is shown for the first time.
	It is a good place to activate resources that are only usefull while the 
	parcel is visible such as animations.
	
	The provided method is empty, it can be overriden by each Parcela app.
	
	@method preView
	*/
	preView: function () {},
	
	/**
	Called by the renderer after this Parcel is hidden.
	
	It is a good place to deactivate resources that are only usefull while the 
	parcel is visible such as animations.
	
	The provided method is empty, it can be overriden by each Parcela app.
	
	@method postView
	*/
	postView: function () {},


	/**
	Returns the virtual DOM for this parcel.

	Must be overriden by each Parcela app.

	A virtual DOM node is composed of the following elements:

	* `tag` {String}:  Name of the HTML tag for the node to be created.
	* `attrs` {Object}: Collection of HTML attributes to be added to the node.
	* `children` {Array}: Array of virtual DOM nodes that will become children of the created node.

	This method will usually use the [`ITSA.vNode`](ITSA.html#method_vNode)
	helper function to produce the virtual DOM node.

	@example
		view: function () {
			var v = I.Parcel.vNode;
			return v('div', [
				v('p.joyful','Hello Workd!'),
				v('hr'),
				v('p','(Not very original, really)')
			]);
		}

		// Equivalent to:
		view: function () {
			return {tag:'div', attrs:{},children: [
				{tag:'p', attrs:{class:'joyful'}, children:['Hellow World!']},
				{tag:'hr', attrs: {}, children: []},
				{tag:'p', attrs:{}, children:['(Not very original, really)']}
			]};
		}
	@method view
	@return {vNode} The expected virtual DOM for this parcel.
	*/
	view: function () {
		return '';
	},

	/**
	Returns a value representative of the state of this parcel.
	The system will compare it with the previous state and if they match,
	it will assume the view has not changed.

	The default function returns `NaN` which is always different than itself.
	It may be overriden for optimization purposes.
	@method stamp
	@return {value} any simple value (no objects or such) that reflects the state of this view
	*/
	stamp: function () {
		return NaN;
	},
	/**
	Provides default initialization values for the configuration of this Parcel.
	It is used by the constructor to merge it with the `config` values it might have
	received.

	The constructor only makes a shallow copy of the values in the hash.
	Object references must be initialized in the [`init`](#method_init) method,
	otherwise they would all point to the very same copy.

	@property defaultConfig
	@type Object
	@default undefined
	*/

	/**
	Type of DOM element that will be created to serve as a container for this Parcel.
	Defaults to a `DIV`

	@property containerType
	@type String
	@default DIV

	*/
	containerType: 'DIV',
	/**
	CSS className to add to the container for this parcel.
	This is in addition to the className of `parcel` which is
	automatically added to all Parcel containers.

	@property className
	@type String
	@default ''
	*/
	className:''
});

module.exports = Parcel;
