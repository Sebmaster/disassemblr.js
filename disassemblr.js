"use strict";

/**
 * Disassemblr allows one to disassemble PE files.
 * 
 * @constructor
 * @param {Uint8Array} buf the bytes of the file to parse
 */
function Disassemblr(buf) {
	this.worker = new Worker('disassemblr-worker.js');
	
	this.worker.onmessage = this.workerMessage.bind(this);
	
	this.worker.postMessage({command: 'buffer', buffer: buf});
}

/**
 * Start parsing of the file. 
 */
Disassemblr.prototype.start = function() {
	this.worker.postMessage({command: 'start'});
};

/**
 * Parse the .text section of the assembly.
 */
Disassemblr.prototype.parseAssembly = function() {
	this.worker.postMessage({command: 'assembly'});
};

/**
 * Called, if we get a message from the worker.
 */
Disassemblr.prototype.workerMessage = function(e) {
	this.onData(e.data);
	
	switch (e.data.command) {
		case 'peHeader':
			this.onHeader(e.data.header);
			break;
		case 'sectionTable':
			this.onSectionTable(e.data.table);
			break;
		case 'assembly':
			this.onAssembly(e.data.assembly);
			break;
		case 'function':
			this.onFunction(e.data.function);
			break;
		case 'error':
			this.onError(e.data.error);
			break;
	}
};

/**
 * The onData event gets called every time we receive some data from the worker.
 * 
 * This method is especially useful, if you want every detail of the assembly,
 * for example PE headers and the section table.
 * 
 * @param {Object} e
 */
Disassemblr.prototype.onData = function(e) {};

/**
 * The onHeader event gets called if we received the full PE headers.
 * 
 * @param {Object} e
 */
Disassemblr.prototype.onHeader = function(e) {};

/**
 * The onSectionTable event gets called if we received the section header
 * immediately following the PE header.
 * 
 * @param {Object} e
 */
Disassemblr.prototype.onSectionTable = function(e) {};

/**
 * The onAssembly event gets called as soon as the .text section got read
 * and converted to a readable format.
 * 
 * @param {Object} e
 */
Disassemblr.prototype.onAssembly = function(e) {};

/**
 * The onFunction event gets called if a new function got detected in the file. 
 * 
 * @param {{name: string, address: string}} func
 */
Disassemblr.prototype.onFunction = function(func) {};

/**
 * The onError event gets called if an error occurred, while parsing the file.
 * 
 * @param {string} str the error message
 */
Disassemblr.prototype.onError = function(str) {};
