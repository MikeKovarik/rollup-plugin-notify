(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('anchora')) :
	typeof define === 'function' && define.amd ? define(['anchora'], factory) :
	(factory(global.anchora));
}(this, (function (anchora) { 'use strict';

	console.log(anchora.createServer());

})));
