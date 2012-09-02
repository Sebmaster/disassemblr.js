"use strict";

importScripts('uint64.js', 'jDataView.js', 'jParser.js', 'DisASMx86.js');

var HeaderStructure = {
	DOSHeader: {
		magic: function() {
			var magic = this.parse('uint16');
			if (magic !== 0x5A4D) {
				throw new Error('File is not a valid DOS file.');
			}
			
			return magic;
		},
		
		peAddress: function() {
			this.skip(58);
			
			return this.parse('uint32');
		}
	},
	
	PEHeader: {
		FileHeader: {
			magic: function() {
				var magic = this.parse('uint32');
				if (magic !== 0x4550) {
					throw new Error('File is not a valid PE file.');
				}
				
				return magic;
			},
			machine: function() {
				var magic = this.parse('uint16');
				
				if (magic !== 0x14C) {
					throw new Error('Image is not a x86 image.');
				}
				
				return magic;
			},
			sectionCount: 'uint16',
			creationDate: function() {
				return new Date(this.parse('uint32') * 1000);
			},
			symbolOffset: 'uint32',
			symbolCount: 'uint32',
			optHeaderSize: 'uint16',
			flags: 'uint16'
		},
		
		OptHeader: {
			imageType: function() {
				var magic = this.parse('uint16');
				switch (magic) {
					case 0x10B:
						return '32bit';
					case 0x20B:
						return '64bit';
					case 0x107:
						return 'ROM';
				}
			},
			linkerMajor: 'uint8',
			linkerMinor: 'uint8',
			codeSize: 'uint32',
			dataInitializedSize: 'uint32',
			dataUninitializedSize: 'uint32',
			entryPoint: 'uint32',
			baseCode: 'uint32',
			baseData: function() {
				if (this.current.magic !== 0x20B) {
					return this.parse('uint32');
				}
				
				return null;
			},
			baseImage: 'uint32',
			alignmentSection: 'uint32',
			alignmentFile: 'uint32',
			osMajor: 'uint16',
			osMinor: 'uint16',
			imageMajor: 'uint16',
			imageMinor: 'uint16',
			subsystemMajor: 'uint16',
			subsystemMinor: 'uint16',
			win32Version: 'uint32',
			imageSize: 'uint32',
			headerSize: 'uint32',
			checksum: 'uint32',
			subsystem: function() {
				var subsystem = this.parse('uint16');
				switch (subsystem) {
					case 1:
						return 'NATIVE';
					case 2:
						return 'GUI';
					case 3:
						return 'CONSOLE';
				}
			},
			dllFlags: 'uint16',
			stackReserve: 'uint32',
			stackCommit: 'uint32',
			heapReserve: 'uint32',
			heapCommit: 'uint32',
			loaderFlags: 'uint32',
			rvaCount: 'uint32',
			dataDirectory: function() {
				return this.parse(['array', {
					virtualAddress: 'uint32',
					size: 'uint32'
				}, this.current.rvaCount]);
			}
		}
	},
	
	SectionEntry: {
		name: function() {
			var str = this.parse(['string', 8]);
			for (var i=0; i < str.length; ++i) {
				if (str.charCodeAt(i) === 0) {
					str = str.substring(0, i);
					break;
				}
			}
			
			return str;
		},
		virtualSize: 'uint32',
		virtualAddress: 'uint32',
		rawDataSize: 'uint32',
		rawDataOffset: 'uint32',
		relocationsOffset: 'uint32',
		lineNumbersOffset: 'uint32',
		relocationsCount: 'uint16',
		lineNumbersCount: 'uint16',
		flags: 'uint32'
	}
};

var buffer;
var peHeader;
var sectionTable;

/**
 * Controls the full parsing process. 
 */
function parseBuffer() {
	var dataView = new jDataView(buffer.buffer, 0, undefined, true);
	var parser = new jParser(dataView, HeaderStructure);
	
	try {
		var peHeaderOffset = parser.parse('DOSHeader').peAddress;
		
		parser.seek(peHeaderOffset);
		
		peHeader = parser.parse('PEHeader');
		self.postMessage({command: 'peHeader', header: peHeader});
		
		sectionTable = parser.parse(['array', 'SectionEntry', peHeader.FileHeader.sectionCount]);
		self.postMessage({command: 'sectionTable', table: sectionTable});
	} catch (e) {
		e = e.message || e;
		self.postMessage({command: 'error', error: e})
	}
};

/**
 * Receives the command messages of the main Disassemblr class.
 *  
 * @param {Object} e
 */
self.onmessage = function(e) {
	switch (e.data.command) {
		case 'buffer':
			buffer = e.data.buffer;
			break;
		case 'assembly':
			var disasmx86 = new DisASMx86();
			
			var textSection = sectionTable[0];
			var offset = textSection.rawDataOffset;
			var to = offset + textSection.rawDataSize;
			var asmStr = '';
			
			for (var i = offset; i < to;) {
				var data = disasmx86.parseAndFormat(buffer, i);
				
				i += data.length;
				
				self.postMessage({command: 'assembly', assembly: data.str});
			}
			break;
		case 'start':
			parseBuffer();
			break;
	}
};
