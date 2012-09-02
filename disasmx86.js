(function() {
	"use strict";
	
	/**
	 * Extends object from with properties from to, if to is null, a deep clone is performed
	 * 
	 * @param {Object} from
	 * @param {Object} to
	 * @return {Object} the cloned object
	 */
	function extend(from, to) {
	    if (from == null || typeof from != "object") return from;
	    if (from.constructor != Object && from.constructor != Array) return from;
	    if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
	        from.constructor == String || from.constructor == Number || from.constructor == Boolean)
	        return new from.constructor(from);
	
	    to = to || new from.constructor();
	
	    for (var name in from) {
	        to[name] = typeof to[name] == "undefined" ? extend(from[name], null) : to[name];
	    }
	
	    return to;
	}
	
	/**
	 * A class which enables one to disassemble a x86 assembly.
	 * 
	 * @constructor
	 * @param {{addrSize: number, notation: string}}
	 */
	function DisASMx86(config) {
		if (!config) {
			config = {notation: 'INT'};
		}
		
		this.config = config;
		this.modeConfig = {registerMode: 'r', addrSize: 4};
	}
	
	DisASMx86.Registers = {
		0: {
			r8: 'AL',
			r16: 'AX',
			r32: 'EAX',
			mm: 'MM0',
			xmm: 'XMM0'
		},
		1: {
			r8: 'CL',
			r16: 'CX',
			r32: 'ECX',
			mm: 'MM1',
			xmm: 'XMM1'
		},
		2: {
			r8: 'DL',
			r16: 'DX',
			r32: 'EDX',
			mm: 'MM2',
			xmm: 'XMM2'
		},
		3: {
			r8: 'BL',
			r16: 'BX',
			r32: 'EBX',
			mm: 'MM3',
			xmm: 'XMM3'
		},
		4: {
			r8: 'AH',
			r16: 'SP',
			r32: 'ESP',
			mm: 'MM4',
			xmm: 'XMM4'
		},
		5: {
			r8: 'CH',
			r16: 'BP',
			r32: 'EBP',
			mm: 'MM5',
			xmm: 'XMM5'
		},
		6: {
			r8: 'DH',
			r16: 'SI',
			r32: 'ESI',
			mm: 'MM6',
			xmm: 'XMM6'
		},
		7: {
			r8: 'BH',
			r16: 'DI',
			r32: 'EDI',
			mm: 'MM7',
			xmm: 'XMM7'
		}
	};
	
	DisASMx86.RegisterCombinations = {
		0: 'BX + SI',
		1: 'BX + DI',
		2: 'BP + SI',
		3: 'BP + DI',
		4: 'SI',
		5: 'DI',
		6: 'BP',
		7: 'BX'
	};
	
	DisASMx86.x86Opcodes = {
		prefixes: {
			0x26: {
				mnem: 'ES'
			},
			0x36: {
				mnem: 'SS'
			},
			0x3E: {
				mnem: 'DS'
			},
			0x64: {
				mnem: 'FS'
			},
			0x65: {
				mnem: 'GS'
			},
			0x66: {
				config: {
					addrSize: 2
				}
			},
			0x67: {
				
			},
			0x9B: {
				
			},
			0xF0: {
				mnem: 'LOCK'
			}
		},
		opcodes: [
			{
				seq: [0x00],
				mnem: 'ADD',
				modRM: true,
				operands: ['RM', 'R']
			},
			{
				seq: [0x0B],
				mnem: 'OR',
				modRM: true,
				operands: ['R', 'RM']
			},
			{
				seq: [0x50],
				mnem: 'PUSH',
				operands: [DisASMx86.Registers[0]]
			},
			{
				seq: [0x51],
				mnem: 'PUSH',
				operands: [DisASMx86.Registers[1]]
			},
			{
				seq: [0x52],
				mnem: 'PUSH',
				operands: [DisASMx86.Registers[2]]
			},
			{
				seq: [0x53],
				mnem: 'PUSH',
				operands: [DisASMx86.Registers[3]]
			},
			{
				seq: [0x54],
				mnem: 'PUSH',
				operands: [DisASMx86.Registers[4]]
			},
			{
				seq: [0x55],
				mnem: 'PUSH',
				operands: [DisASMx86.Registers[5]]
			},
			{
				seq: [0x56],
				mnem: 'PUSH',
				operands: [DisASMx86.Registers[6]]
			},
			{
				seq: [0x57],
				mnem: 'PUSH',
				operands: [DisASMx86.Registers[7]]
			},
			{
				seq: [0x58],
				mnem: 'POP',
				operands: [DisASMx86.Registers[0]]
			},
			{
				seq: [0x59],
				mnem: 'POP',
				operands: [DisASMx86.Registers[1]]
			},
			{
				seq: [0x5A],
				mnem: 'POP',
				operands: [DisASMx86.Registers[2]]
			},
			{
				seq: [0x5B],
				mnem: 'POP',
				operands: [DisASMx86.Registers[3]]
			},
			{
				seq: [0x5C],
				mnem: 'POP',
				operands: [DisASMx86.Registers[4]]
			},
			{
				seq: [0x5D],
				mnem: 'POP',
				operands: [DisASMx86.Registers[5]]
			},
			{
				seq: [0x5E],
				mnem: 'POP',
				operands: [DisASMx86.Registers[6]]
			},
			{
				seq: [0x5F],
				mnem: 'POP',
				operands: [DisASMx86.Registers[7]]
			},
			{
				seq: [0x8B],
				mnem: 'MOV',
				modRM: true,
				operands: ['R', 'RM']
			},
			{
				seq: [0xC3],
				mnem: 'RETN'
			},
			{
				seq: [0xDF, 0xE0],
				op_ext: {
					4: {
						mnem: 'FNSTSW',
						operands: [DisASMx86.Registers[0]],
						prefixes: {
							0x9B: {
								mnem: 'FSTSW'
							}
						}
					}
				}
			},
			{
				seq: [0xF7],
				op_ext: {
					0: {
						mnem: 'TEST',
						operands: ['RM', 'I']
					},
					1: {
						mnem: 'TEST'
					},
					2: {
						mnem: 'NOT'
					},
					3: {
						mnem: 'NEG'
					},
					4: {
						mnem: 'MUL'
					},
					5: {
						mnem: 'IMUL'
					},
					6: {
						mnem: 'DIV'
					},
					7: {
						mnem: 'IDIV'
					}
				}
			}
		]
	};
	
	DisASMx86.prototype.config = null;
	
	/**
	 * Determines the opcode extension of a ModR/M byte.
	 * 
	 * @private
	 * @param {number} b the byte to read from
	 * @return {number}
	 */
	DisASMx86.prototype.getReg = function(b) {
		return (b >> 3) & 7;
	};
	
	/**
	 * Determines the mod bits of the ModR/M byte.
	 * 
	 * @private
	 * @param {number} b the byte to read from
	 * @return {number}
	 */
	DisASMx86.prototype.getMod = function(b) {
		return b >> 6;
	};
	
	/**
	 * Determines the R/M bits of the ModR/M byte.
	 * 
	 * @private
	 * @param {number} b the byte to read from
	 * @return {{src: {reg: Object, displ: number, adrOf: boolean, sib: boolean}, dest: Object}}
	 */
	DisASMx86.prototype.getRM = function(b) {
		return b & 7;
	};
	
	/**
	 * Disassembles all prefix bytes. 
	 * 
	 * @protected
	 * @param {Array.<number>|Uint8Array} buf the buffer to read from
	 * @param {number} offset the offset from the start of the buffer
	 * @return {{prefixes: Array.<number>, length: number}}
	 */
	DisASMx86.prototype.parsePrefixes = function(buf, offset) {
		var prefixes = [];
		for (var i=0; buf[offset + i] in DisASMx86.x86Opcodes.prefixes; ++i) {
			prefixes.push(buf[offset + i]);
		}
		
		return prefixes;
	};
	
	/**
	 * Disassembles a single operation. 
	 * 
	 * @protected
	 * @param {Array.<number>|Uint8Array} buf the buffer to read from
	 * @param {number} offset the offset from the start of the buffer
	 * @param {Array.<number>} prefixes the prefixes to modify the instruction
	 * @return {{operation: Array.<Object>, length: number}}
	 */
	DisASMx86.prototype.parseOperation = function(buf, offset, prefixes) {
		var operation = null;
		
		for (var i=0; i < DisASMx86.x86Opcodes.opcodes.length; ++i) {
			var op = DisASMx86.x86Opcodes.opcodes[i];
			if (operation !== null && op.seq.length <= operation.seq.length) continue;
			
			var j = 0;
			for (; j < op.seq.length; ++j) {
				if (op.seq[j] !== buf[offset + j]) break;
			}
			if (j !== op.seq.length) continue;
			
			if (op.op_ext) {
				var finalExt = null;
				for (var ext in op.op_ext) {
					if (ext == this.getReg(buf[offset + op.seq.length - 1])) {
						finalExt = ext;
						break;
					}
				}
				
				if (finalExt === null) continue;
				
				operation = extend(op);
				delete operation.op_ext;
				
				for (var key in op.op_ext[finalExt]) {
					operation[key] = extend(op.op_ext[finalExt][key]);
				}
			} else {
				operation = extend(op);
			}
			
			if (operation.prefixes) {
				for (var prefix in operation.prefixes) {
					for (var k=0; k < prefixes.length; ++k) {
						if (prefix == prefixes[k]) {
							for (var key in operation.prefixes[prefix]) {
								operation[key] = extend(operation.prefixes[prefix][key]);
							}
							
							prefixes.splice(k, 1);
							--k;
						}
					}
				}
				
				delete operation.prefixes;
			}
			
			break;
		}
		
		if (operation === null) {
			throw new Error('Unknown assembly opcode (' + buf[offset].toString(16) + ').');
		}
		
		return operation;
	}
	
	/**
	 * Parses the ModR/M byte.
	 * 
	 * @protected
	 * @param {number} b the ModR/M byte
	 * @return {src: {reg: Object, sib: boolean, disp: number}, dest: string}
	 */
	DisASMx86.prototype.parseModRM = function(b) {
		var dest = DisASMx86.Registers[this.getReg(b)];
		var displ = 0;
		var adrOf = true;
		var sib = false;
		var regData = null;
		var modMemory = true;
		
		var mod = this.getMod(b);
		switch (mod) { // case 0 handled as default
			case 1:
				displ = 1;
				break;
			case 2:
				displ = this.modeConfig.addrSize; // TODO: Check if addrSize is correct here
				break;
			case 3:
				adrOf = false;
				modMemory = false;
				break;
		}
		
		var reg = this.getRM(b);
		switch (reg) {
			case 0:
			case 1:
			case 2:
			case 3:
			case 6:
			case 7:
				if (modMemory && this.config.addrSize === 2) { // 16bit mode has custom combinations
					regData = DisASMx86.RegisterCombinations[reg];
				} else {
					regData = DisASMx86.Registers[reg];
				}
				break;
			case 4:
				if (modMemory) {
					sib = true;
				} else {
					regData = DisASMx86.Registers[reg];
				}
				break;
			case 5:
				if (displ === 0 && adrOf) {
					displ = this.modeConfig.addrSize; // TODO: Check if addrSize is correct here
				} else {
					regData = DisASMx86.Registers[reg];
				}
				break;
		}
		
		return {
			src: {
				reg: regData,
				displ: displ,
				adrOf: adrOf,
				sib: sib
			},
			dest: dest
		};
	};
	
	/**
	 * Parses the sib byte.
	 * 
	 * @protected
	 * @param {number} b the sib byte
	 * @return {scale: number, index: number, base: number}
	 */
	DisASMx86.prototype.parseSIB = function(b) {
		return {scale: b >> 6, index: (b >> 3) & 7, base: b & 7}
	};
	
	/**
	 * Disassembles a single instruction from a buffer. 
	 * 
	 * @param {Array.<number>|Uint8Array} buf the buffer to read from
	 * @param {number} offset the offset from the start of the buffer
	 * @return {{opcode: number, length: number}}
	 */
	DisASMx86.prototype.parseInstruction = function(buf, offset) {
		if (!offset) offset = 0;
		this.modeConfig = {registerMode: 'r', addrSize: 4};
		
		var modRM = null;
		var sib = null;
		var preOffset = offset;
		var displacement = null;
		var immediate = null;
		
		var prefixes = this.parsePrefixes(buf, offset);
		offset += prefixes.length;
		
		var operation = this.parseOperation(buf, offset, prefixes);
		offset += operation.seq.length;
		
		if (operation.modRM) {
			modRM = this.parseModRM(buf[offset]);
			offset++;
			
			if (modRM.src.sib) {
				sib = this.parseSIB(buf[offset]);
				offset++;
			}
		
			if (modRM.src.displ) {
				displacement = 0;
				for (var i=0; i < modRM.src.displ; ++i, ++offset) {
					displacement += buf[offset] * Math.pow(2, i * 8);
				}
				if (displacement > 127) {
					displacement -= 256;
				}
			}
		}
		
		if (operation.immed) {
			immediate = 0;
			for (var i=0; i < config.addrSize; ++i, ++offset) { // TODO: Check if addrSize is the correct one for this
				immediate += buf[offset] * Math.pow(2, i * 8);
			}
		}
		
		return {
			prefixes: prefixes,
			opcode: operation,
			modRM: modRM,
			sib: sib,
			disp: displacement,
			immediate: immediate,
			length: offset - preOffset
		};
	};
	
	/**
	 * Parses an instruction and returns a formatted string.
	 * 
	 * @param {Array.<number>|Uint8Array} buf the buffer to read from
	 * @param {number} offset the offset from the start of the buffer
	 * @return {string}
	 */
	DisASMx86.prototype.parseAndFormat = function(buf, offset) {
		var data = this.parseInstruction(buf, offset);
		var str = '';
		
		if (this.config.notation === 'INT') {
			for (var i=0; i < data.prefixes.length; ++i) {
				if (data.prefixes[i].mnem) {
					str += ' ' + data.prefixes[i].mnem;
				}
			}
			
			str += ' ' + data.opcode.mnem;
			
			if (data.opcode.operands) {
				var opStr = '';
				for (var i=0; i < data.opcode.operands.length; ++i) {
					var op = data.opcode.operands[i];
					opStr += ', ';
					
					if (op === 'I') {
						opStr += '0x' + data.immediate.toString(16) + 'h';
					} else if (op === 'R') {
						opStr += data.modRM.dest.r32; // TODO: choose right operation mode from operands
					} else if (op === 'RM') {
						if (data.sib) {
							// TODO: Handle SIB byte
						} else {
							if (data.modRM.src.adrOf) {
								opStr += '[' + data.modRM.src.reg.r32 + (data.disp ? ' + ' + data.disp : '') + ']';
							} else {
								opStr += data.modRM.src.reg.r32;
							}
						}
					} else {
						opStr += op.r32; // TODO: choose right operation mode from operands
					}
				}
				
				str += opStr.length > 0 ? ' ' + opStr.substr(2) : '';
			}
		}
		
		return {str: str.length > 0 ? str.substr(1) : '', length: data.length};
	};
	
	self.DisASMx86 = DisASMx86;
})();