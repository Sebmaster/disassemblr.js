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
	 * Parses a given number of bytes from the buffer and returns a number.
	 * 
	 * @param {Array.<number>|Uint8Array} buf
	 * @param {number} offset
	 * @param {number} bytes
	 */
	function parseNumber(buf, offset, bytes) {
		var num = 0;
		
		for (var i=0; i < bytes; ++i) {
			//num = num * 256 + buf[offset + i];
			num += Math.pow(2, 8 * i) * buf[offset + i];
		}
		
		var max = Math.pow(2, bytes * 8);
		if (num > max / 2 - 1) {
			num -= max;
		}
		
		return num;
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
		},
		8: {
			r16: 'CS'
		},
		9: {
			r16: 'DS'
		},
		10: {
			r16: 'SS'
		},
		11: {
			r16: 'ES'
		},
		12: {
			r16: 'FS'
		},
		13: {
			r16: 'GS'
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
					operSize: 2
				}
			},
			0x67: {
				config: {
					addrSize: 2
				}
			},
			0x9B: {
				
			},
			0xF0: {
				mnem: 'LOCK'
			},
			0xF2: {
				mnem: 'REPNZ'
			},
			0xF3: {
				mnem: 'REPZ'
			}
		},
		opcodes: [
			{
				seq: [0x00],
				mnem: 'ADD',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x01],
				mnem: 'ADD',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x02],
				mnem: 'ADD',
				operands: [{a: 'G', t: 'b'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x03],
				mnem: 'ADD',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x04],
				mnem: 'ADD',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x05],
				mnem: 'ADD',
				operands: [{r: DisASMx86.Registers[0], t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x06],
				mnem: 'PUSH',
				operands: [{r: DisASMx86.Registers[11], t: 'w'}]
			},
			{
				seq: [0x07],
				mnem: 'POP',
				operands: [{r: DisASMx86.Registers[11], t: 'w'}]
			},
			{
				seq: [0x08],
				mnem: 'OR',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x09],
				mnem: 'OR',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x0A],
				mnem: 'OR',
				operands: [{a: 'G', t: 'b'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x0B],
				mnem: 'OR',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0C],
				mnem: 'OR',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0D],
				mnem: 'OR',
				operands: [{r: DisASMx86.Registers[0], t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x0E],
				mnem: 'PUSH',
				operands: [{r: DisASMx86.Registers[8], t: 'w'}]
			},
			{
				seq: [0x10],
				mnem: 'ADC',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x11],
				mnem: 'ADC',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x12],
				mnem: 'ADC',
				operands: [{a: 'G', t: 'b'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x13],
				mnem: 'ADC',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x14],
				mnem: 'ADC',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x15],
				mnem: 'ADC',
				operands: [{r: DisASMx86.Registers[0], t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x16],
				mnem: 'PUSH',
				operands: [{r: DisASMx86.Registers[10], t: 'w'}]
			},
			{
				seq: [0x17],
				mnem: 'POP',
				operands: [{r: DisASMx86.Registers[10], t: 'w'}]
			},
			{
				seq: [0x18],
				mnem: 'SBB',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x19],
				mnem: 'SBB',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x1A],
				mnem: 'SBB',
				operands: [{a: 'G', t: 'b'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x1B],
				mnem: 'SBB',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x1C],
				mnem: 'SBB',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x1D],
				mnem: 'SBB',
				operands: [{r: DisASMx86.Registers[0], t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x1E],
				mnem: 'PUSH',
				operands: [{r: DisASMx86.Registers[9], t: 'w'}]
			},
			{
				seq: [0x1F],
				mnem: 'POP',
				operands: [{r: DisASMx86.Registers[9], t: 'w'}]
			},
			{
				seq: [0x20],
				mnem: 'AND',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x21],
				mnem: 'AND',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x22],
				mnem: 'AND',
				operands: [{a: 'G', t: 'b'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x23],
				mnem: 'AND',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x24],
				mnem: 'AND',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x25],
				mnem: 'AND',
				operands: [{r: DisASMx86.Registers[0], t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x26],
				mnem: 'ES'
			},
			{
				seq: [0x27],
				mnem: 'DAA'
			},
			{
				seq: [0x28],
				mnem: 'SUB',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x29],
				mnem: 'SUB',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x2A],
				mnem: 'SUB',
				operands: [{a: 'G', t: 'b'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x2B],
				mnem: 'SUB',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x2C],
				mnem: 'SUB',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x2D],
				mnem: 'SUB',
				operands: [{r: DisASMx86.Registers[0], t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x2E],
				mnem: 'CS'
			},
			{
				seq: [0x2E],
				mnem: 'NTAKEN'
			},
			{
				seq: [0x2F],
				mnem: 'DAS'
			},
			{
				seq: [0x30],
				mnem: 'XOR',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x31],
				mnem: 'XOR',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x32],
				mnem: 'XOR',
				operands: [{a: 'G', t: 'b'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x33],
				mnem: 'XOR',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x34],
				mnem: 'XOR',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x35],
				mnem: 'XOR',
				operands: [{r: DisASMx86.Registers[0], t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x36],
				mnem: 'SS'
			},
			{
				seq: [0x37],
				mnem: 'AAA'
			},
			{
				seq: [0x38],
				mnem: 'CMP',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x39],
				mnem: 'CMP',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x3A],
				mnem: 'CMP',
				operands: [{a: 'G', t: 'b'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x3B],
				mnem: 'CMP',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x3C],
				mnem: 'CMP',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x3D],
				mnem: 'CMP',
				operands: [{r: DisASMx86.Registers[0], t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x3E],
				mnem: 'DS'
			},
			{
				seq: [0x3E],
				mnem: 'TAKEN'
			},
			{
				seq: [0x3F],
				mnem: 'AAS'
			},
			{
				seq: [0x40],
				mnem: 'INC',
				operands: [{a: 'Z', t: 'v'}]
			},
			{
				seq: [0x48],
				mnem: 'DEC',
				operands: [{a: 'Z', t: 'v'}]
			},
			{
				seq: [0x50],
				mnem: 'PUSH',
				operands: [{a: 'Z', t: 'v'}]
			},
			{
				seq: [0x58],
				mnem: 'POP',
				operands: [{a: 'Z', t: 'v'}]
			},
			{
				seq: [0x60],
				mnem: 'PUSHA'
			},
			{
				seq: [0x60],
				mnem: 'PUSHAD'
			},
			{
				seq: [0x61],
				mnem: 'POPA'
			},
			{
				seq: [0x61],
				mnem: 'POPAD'
			},
			{
				seq: [0x62],
				mnem: 'BOUND',
				operands: [{a: 'G', t: 'v'}, {a: 'M', t: 'a'}]
			},
			{
				seq: [0x63],
				mnem: 'ARPL',
				operands: [{a: 'E', t: 'w'}, {a: 'G', t: 'w'}]
			},
			{
				seq: [0x64],
				mnem: 'FS'
			},
			{
				seq: [0x64],
				mnem: 'ALTER'
			},
			{
				seq: [0x65],
				mnem: 'GS'
			},
			{
				seq: [0x68],
				mnem: 'PUSH',
				operands: [{a: 'I', t: 'vs'}]
			},
			{
				seq: [0x69],
				mnem: 'IMUL',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x6A],
				mnem: 'PUSH',
				operands: [{a: 'I', t: 'bss'}]
			},
			{
				seq: [0x6B],
				mnem: 'IMUL',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}, {a: 'I', t: 'bs'}]
			},
			{
				seq: [0x6C],
				mnem: 'INS',
				operands: [{r: DisASMx86.Registers[2], t: 'w'}]
			},
			{
				seq: [0x6D],
				mnem: 'INS',
				operands: [{r: DisASMx86.Registers[2], t: 'w'}]
			},
			{
				seq: [0x6D],
				mnem: 'INS',
				operands: [{r: DisASMx86.Registers[2], t: 'w'}]
			},
			{
				seq: [0x6E],
				mnem: 'OUTS',
				operands: [{r: DisASMx86.Registers[2], t: 'w'}]
			},
			{
				seq: [0x6F],
				mnem: 'OUTS',
				operands: [{r: DisASMx86.Registers[2], t: 'w'}]
			},
			{
				seq: [0x6F],
				mnem: 'OUTS',
				operands: [{r: DisASMx86.Registers[2], t: 'w'}]
			},
			{
				seq: [0x70],
				mnem: 'JO',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x71],
				mnem: 'JNO',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x72],
				mnem: 'JB',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x73],
				mnem: 'JNB',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x74],
				mnem: 'JZ',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x75],
				mnem: 'JNZ',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x76],
				mnem: 'JBE',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x77],
				mnem: 'JNBE',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x78],
				mnem: 'JS',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x79],
				mnem: 'JNS',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x7A],
				mnem: 'JP',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x7B],
				mnem: 'JNP',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x7C],
				mnem: 'JL',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x7D],
				mnem: 'JNL',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x7E],
				mnem: 'JLE',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x7F],
				mnem: 'JNLE',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0x80],
				mnem: 'ADD',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x80],
				mnem: 'OR',
				opExt: 1,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x80],
				mnem: 'ADC',
				opExt: 2,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x80],
				mnem: 'SBB',
				opExt: 3,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x80],
				mnem: 'AND',
				opExt: 4,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x80],
				mnem: 'SUB',
				opExt: 5,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x80],
				mnem: 'XOR',
				opExt: 6,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x80],
				mnem: 'CMP',
				opExt: 7,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x81],
				mnem: 'ADD',
				opExt: 0,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x81],
				mnem: 'OR',
				opExt: 1,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x81],
				mnem: 'ADC',
				opExt: 2,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x81],
				mnem: 'SBB',
				opExt: 3,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x81],
				mnem: 'AND',
				opExt: 4,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x81],
				mnem: 'SUB',
				opExt: 5,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x81],
				mnem: 'XOR',
				opExt: 6,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x81],
				mnem: 'CMP',
				opExt: 7,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0x82],
				mnem: 'ADD',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x82],
				mnem: 'OR',
				opExt: 1,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x82],
				mnem: 'ADC',
				opExt: 2,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x82],
				mnem: 'SBB',
				opExt: 3,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x82],
				mnem: 'AND',
				opExt: 4,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x82],
				mnem: 'SUB',
				opExt: 5,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x82],
				mnem: 'XOR',
				opExt: 6,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x82],
				mnem: 'CMP',
				opExt: 7,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x83],
				mnem: 'ADD',
				opExt: 0,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'bs'}]
			},
			{
				seq: [0x83],
				mnem: 'OR',
				opExt: 1,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'bs'}]
			},
			{
				seq: [0x83],
				mnem: 'ADC',
				opExt: 2,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'bs'}]
			},
			{
				seq: [0x83],
				mnem: 'SBB',
				opExt: 3,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'bs'}]
			},
			{
				seq: [0x83],
				mnem: 'AND',
				opExt: 4,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'bs'}]
			},
			{
				seq: [0x83],
				mnem: 'SUB',
				opExt: 5,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'bs'}]
			},
			{
				seq: [0x83],
				mnem: 'XOR',
				opExt: 6,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'bs'}]
			},
			{
				seq: [0x83],
				mnem: 'CMP',
				opExt: 7,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'bs'}]
			},
			{
				seq: [0x84],
				mnem: 'TEST',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x85],
				mnem: 'TEST',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x86],
				mnem: 'XCHG',
				operands: [{a: 'G', t: 'b'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x87],
				mnem: 'XCHG',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x88],
				mnem: 'MOV',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x89],
				mnem: 'MOV',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x8A],
				mnem: 'MOV',
				operands: [{a: 'G', t: 'b'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x8B],
				mnem: 'MOV',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x8C],
				mnem: 'MOV',
				operands: [{a: 'M', t: 'w'}, {a: 'S', t: 'w'}]
			},
			{
				seq: [0x8D],
				mnem: 'LEA',
				operands: [{a: 'G', t: 'vqp'}, {a: 'M', t: null}]
			},
			{
				seq: [0x8E],
				mnem: 'MOV',
				operands: [{a: 'S', t: 'w'}, {a: 'E', t: 'w'}]
			},
			{
				seq: [0x8F],
				mnem: 'POP',
				opExt: 0,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x90],
				mnem: 'XCHG',
				operands: [{a: 'Z', t: 'vqp'}, {r: DisASMx86.Registers[0], t: 'vqp'}]
			},
			{
				seq: [0x90],
				mnem: 'NOP'
			},
			{
				seq: [0x90],
				mnem: 'NOP'
			},
			{
				seq: [0x90],
				mnem: 'PAUSE',
				instrExt: 'sse2'
			},
			{
				seq: [0x98],
				mnem: 'CBW'
			},
			{
				seq: [0x98],
				mnem: 'CWDE'
			},
			{
				seq: [0x99],
				mnem: 'CWD'
			},
			{
				seq: [0x99],
				mnem: 'CDQ'
			},
			{
				seq: [0x9A],
				mnem: 'CALLF',
				operands: [{a: 'A', t: 'p'}]
			},
			{
				seq: [0x9B],
				mnem: 'FWAIT'
			},
			{
				seq: [0x9C],
				mnem: 'PUSHF'
			},
			{
				seq: [0x9C],
				mnem: 'PUSHFD'
			},
			{
				seq: [0x9D],
				mnem: 'POPF'
			},
			{
				seq: [0x9D],
				mnem: 'POPFD'
			},
			{
				seq: [0x9E],
				mnem: 'SAHF'
			},
			{
				seq: [0x9F],
				mnem: 'LAHF'
			},
			{
				seq: [0xA0],
				mnem: 'MOV',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'O', t: 'b'}]
			},
			{
				seq: [0xA1],
				mnem: 'MOV',
				operands: [{r: DisASMx86.Registers[0], t: 'vqp'}, {a: 'O', t: 'vqp'}]
			},
			{
				seq: [0xA2],
				mnem: 'MOV',
				operands: [{a: 'O', t: 'b'}, {r: DisASMx86.Registers[0], t: 'b'}]
			},
			{
				seq: [0xA3],
				mnem: 'MOV',
				operands: [{a: 'O', t: 'vqp'}, {r: DisASMx86.Registers[0], t: 'vqp'}]
			},
			{
				seq: [0xA4],
				mnem: 'MOVS'
			},
			{
				seq: [0xA5],
				mnem: 'MOVS'
			},
			{
				seq: [0xA5],
				mnem: 'MOVS'
			},
			{
				seq: [0xA6],
				mnem: 'CMPS'
			},
			{
				seq: [0xA7],
				mnem: 'CMPS'
			},
			{
				seq: [0xA7],
				mnem: 'CMPS'
			},
			{
				seq: [0xA8],
				mnem: 'TEST',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xA9],
				mnem: 'TEST',
				operands: [{r: DisASMx86.Registers[0], t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0xAA],
				mnem: 'STOS'
			},
			{
				seq: [0xAB],
				mnem: 'STOS'
			},
			{
				seq: [0xAB],
				mnem: 'STOS'
			},
			{
				seq: [0xAC],
				mnem: 'LODS'
			},
			{
				seq: [0xAD],
				mnem: 'LODS'
			},
			{
				seq: [0xAD],
				mnem: 'LODS'
			},
			{
				seq: [0xAE],
				mnem: 'SCAS'
			},
			{
				seq: [0xAF],
				mnem: 'SCAS'
			},
			{
				seq: [0xAF],
				mnem: 'SCAS'
			},
			{
				seq: [0xB0],
				mnem: 'MOV',
				operands: [{a: 'Z', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xB8],
				mnem: 'MOV',
				operands: [{a: 'Z', t: 'vqp'}, {a: 'I', t: 'vqp'}]
			},
			{
				seq: [0xC0],
				mnem: 'ROL',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC0],
				mnem: 'ROR',
				opExt: 1,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC0],
				mnem: 'RCL',
				opExt: 2,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC0],
				mnem: 'RCR',
				opExt: 3,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC0],
				mnem: 'SHL',
				opExt: 4,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC0],
				mnem: 'SHR',
				opExt: 5,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC0],
				mnem: 'SAL',
				opExt: 6,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC0],
				mnem: 'SAR',
				opExt: 7,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC1],
				mnem: 'ROL',
				opExt: 0,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC1],
				mnem: 'ROR',
				opExt: 1,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC1],
				mnem: 'RCL',
				opExt: 2,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC1],
				mnem: 'RCR',
				opExt: 3,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC1],
				mnem: 'SHL',
				opExt: 4,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC1],
				mnem: 'SHR',
				opExt: 5,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC1],
				mnem: 'SAL',
				opExt: 6,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC1],
				mnem: 'SAR',
				opExt: 7,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC2],
				mnem: 'RETN',
				operands: [{a: 'I', t: 'w'}]
			},
			{
				seq: [0xC3],
				mnem: 'RETN'
			},
			{
				seq: [0xC4],
				mnem: 'LES',
				operands: [{a: 'G', t: 'v'}, {a: 'M', t: 'p'}]
			},
			{
				seq: [0xC5],
				mnem: 'LDS',
				operands: [{a: 'G', t: 'v'}, {a: 'M', t: 'p'}]
			},
			{
				seq: [0xC6],
				mnem: 'MOV',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC7],
				mnem: 'MOV',
				opExt: 0,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vds'}]
			},
			{
				seq: [0xC8],
				mnem: 'ENTER',
				operands: [{a: 'I', t: 'w'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xC9],
				mnem: 'LEAVE'
			},
			{
				seq: [0xCA],
				mnem: 'RETF',
				operands: [{a: 'I', t: 'w'}]
			},
			{
				seq: [0xCB],
				mnem: 'RETF'
			},
			{
				seq: [0xCC],
				mnem: 'INT'
			},
			{
				seq: [0xCD],
				mnem: 'INT',
				operands: [{a: 'I', t: 'b'}]
			},
			{
				seq: [0xCE],
				mnem: 'INTO'
			},
			{
				seq: [0xCF],
				mnem: 'IRET'
			},
			{
				seq: [0xCF],
				mnem: 'IRETD'
			},
			{
				seq: [0xD0],
				mnem: 'ROL',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xD0],
				mnem: 'ROR',
				opExt: 1,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xD0],
				mnem: 'RCL',
				opExt: 2,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xD0],
				mnem: 'RCR',
				opExt: 3,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xD0],
				mnem: 'SHL',
				opExt: 4,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xD0],
				mnem: 'SHR',
				opExt: 5,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xD0],
				mnem: 'SAL',
				opExt: 6,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xD0],
				mnem: 'SAR',
				opExt: 7,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xD1],
				mnem: 'ROL',
				opExt: 0,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xD1],
				mnem: 'ROR',
				opExt: 1,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xD1],
				mnem: 'RCL',
				opExt: 2,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xD1],
				mnem: 'RCR',
				opExt: 3,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xD1],
				mnem: 'SHL',
				opExt: 4,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xD1],
				mnem: 'SHR',
				opExt: 5,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xD1],
				mnem: 'SAL',
				opExt: 6,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xD1],
				mnem: 'SAR',
				opExt: 7,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xD2],
				mnem: 'ROL',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD2],
				mnem: 'ROR',
				opExt: 1,
				operands: [{a: 'E', t: 'b'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD2],
				mnem: 'RCL',
				opExt: 2,
				operands: [{a: 'E', t: 'b'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD2],
				mnem: 'RCR',
				opExt: 3,
				operands: [{a: 'E', t: 'b'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD2],
				mnem: 'SHL',
				opExt: 4,
				operands: [{a: 'E', t: 'b'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD2],
				mnem: 'SHR',
				opExt: 5,
				operands: [{a: 'E', t: 'b'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD2],
				mnem: 'SAL',
				opExt: 6,
				operands: [{a: 'E', t: 'b'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD2],
				mnem: 'SAR',
				opExt: 7,
				operands: [{a: 'E', t: 'b'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD3],
				mnem: 'ROL',
				opExt: 0,
				operands: [{a: 'E', t: 'vqp'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD3],
				mnem: 'ROR',
				opExt: 1,
				operands: [{a: 'E', t: 'vqp'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD3],
				mnem: 'RCL',
				opExt: 2,
				operands: [{a: 'E', t: 'vqp'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD3],
				mnem: 'RCR',
				opExt: 3,
				operands: [{a: 'E', t: 'vqp'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD3],
				mnem: 'SHL',
				opExt: 4,
				operands: [{a: 'E', t: 'vqp'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD3],
				mnem: 'SHR',
				opExt: 5,
				operands: [{a: 'E', t: 'vqp'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD3],
				mnem: 'SAL',
				opExt: 6,
				operands: [{a: 'E', t: 'vqp'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD3],
				mnem: 'SAR',
				opExt: 7,
				operands: [{a: 'E', t: 'vqp'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0xD4, 0x0A],
				mnem: 'AAM'
			},
			{
				seq: [0xD4],
				mnem: 'AMX',
				operands: [{a: 'I', t: 'b'}]
			},
			{
				seq: [0xD5, 0x0A],
				mnem: 'AAD'
			},
			{
				seq: [0xD5],
				mnem: 'ADX',
				operands: [{a: 'I', t: 'b'}]
			},
			{
				seq: [0xD6],
				mnem: 'SALC'
			},
			{
				seq: [0xD7],
				mnem: 'XLAT'
			},
			{
				seq: [0xD8],
				mnem: 'FADD',
				opExt: 0,
				operands: [{a: 'M', t: 'sr'}]
			},
			{
				seq: [0xD8],
				mnem: 'FMUL',
				opExt: 1,
				operands: [{a: 'M', t: 'sr'}]
			},
			{
				seq: [0xD8],
				mnem: 'FCOM',
				opExt: 2,
				operands: [{a: 'ES', t: 'sr'}]
			},
			{
				seq: [0xD8, 0xD1],
				mnem: 'FCOM',
				opExt: 2
			},
			{
				seq: [0xD8],
				mnem: 'FCOMP',
				opExt: 3,
				operands: [{a: 'ES', t: 'sr'}]
			},
			{
				seq: [0xD8, 0xD9],
				mnem: 'FCOMP',
				opExt: 3
			},
			{
				seq: [0xD8],
				mnem: 'FSUB',
				opExt: 4,
				operands: [{a: 'M', t: 'sr'}]
			},
			{
				seq: [0xD8],
				mnem: 'FSUBR',
				opExt: 5,
				operands: [{a: 'M', t: 'sr'}]
			},
			{
				seq: [0xD8],
				mnem: 'FDIV',
				opExt: 6,
				operands: [{a: 'M', t: 'sr'}]
			},
			{
				seq: [0xD8],
				mnem: 'FDIVR',
				opExt: 7,
				operands: [{a: 'M', t: 'sr'}]
			},
			{
				seq: [0xD9],
				mnem: 'FLD',
				opExt: 0,
				operands: [{a: 'ES', t: 'sr'}]
			},
			{
				seq: [0xD9],
				mnem: 'FXCH',
				opExt: 1,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xD9, 0xC9],
				mnem: 'FXCH',
				opExt: 1
			},
			{
				seq: [0xD9],
				mnem: 'FST',
				opExt: 2,
				operands: [{a: 'M', t: 'sr'}]
			},
			{
				seq: [0xD9, 0xD0],
				mnem: 'FNOP',
				opExt: 2
			},
			{
				seq: [0xD9],
				mnem: 'FSTP',
				opExt: 3,
				operands: [{a: 'M', t: 'sr'}]
			},
			{
				seq: [0xD9],
				mnem: 'FSTP1',
				opExt: 3,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xD9],
				mnem: 'FSTP1',
				opExt: 3,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xD9],
				mnem: 'FLDENV',
				opExt: 4,
				operands: [{a: 'M', t: 'e'}]
			},
			{
				seq: [0xD9, 0xE0],
				mnem: 'FCHS',
				opExt: 4
			},
			{
				seq: [0xD9, 0xE1],
				mnem: 'FABS',
				opExt: 4
			},
			{
				seq: [0xD9, 0xE4],
				mnem: 'FTST',
				opExt: 4
			},
			{
				seq: [0xD9, 0xE5],
				mnem: 'FXAM',
				opExt: 4
			},
			{
				seq: [0xD9],
				mnem: 'FLDCW',
				opExt: 5,
				operands: [{a: 'M', t: 'w'}]
			},
			{
				seq: [0xD9, 0xE8],
				mnem: 'FLD1',
				opExt: 5
			},
			{
				seq: [0xD9, 0xE9],
				mnem: 'FLDL2T',
				opExt: 5
			},
			{
				seq: [0xD9, 0xEA],
				mnem: 'FLDL2E',
				opExt: 5
			},
			{
				seq: [0xD9, 0xEB],
				mnem: 'FLDPI',
				opExt: 5
			},
			{
				seq: [0xD9, 0xEC],
				mnem: 'FLDLG2',
				opExt: 5
			},
			{
				seq: [0xD9, 0xED],
				mnem: 'FLDLN2',
				opExt: 5
			},
			{
				seq: [0xD9, 0xEE],
				mnem: 'FLDZ',
				opExt: 5
			},
			{
				seq: [0xD9],
				mnem: 'FNSTENV',
				opExt: 6,
				operands: [{a: 'M', t: 'e'}]
			},
			{
				seq: [0xD9],
				mnem: 'FSTENV',
				opExt: 6,
				operands: [{a: 'M', t: 'e'}]
			},
			{
				seq: [0xD9, 0xF0],
				mnem: 'F2XM1',
				opExt: 6
			},
			{
				seq: [0xD9, 0xF1],
				mnem: 'FYL2X',
				opExt: 6
			},
			{
				seq: [0xD9, 0xF2],
				mnem: 'FPTAN',
				opExt: 6
			},
			{
				seq: [0xD9, 0xF3],
				mnem: 'FPATAN',
				opExt: 6
			},
			{
				seq: [0xD9, 0xF4],
				mnem: 'FXTRACT',
				opExt: 6
			},
			{
				seq: [0xD9, 0xF5],
				mnem: 'FPREM1',
				opExt: 6
			},
			{
				seq: [0xD9, 0xF6],
				mnem: 'FDECSTP',
				opExt: 6
			},
			{
				seq: [0xD9, 0xF7],
				mnem: 'FINCSTP',
				opExt: 6
			},
			{
				seq: [0xD9],
				mnem: 'FNSTCW',
				opExt: 7,
				operands: [{a: 'M', t: 'w'}]
			},
			{
				seq: [0xD9],
				mnem: 'FSTCW',
				opExt: 7,
				operands: [{a: 'M', t: 'w'}]
			},
			{
				seq: [0xD9, 0xF8],
				mnem: 'FPREM',
				opExt: 7
			},
			{
				seq: [0xD9, 0xF9],
				mnem: 'FYL2XP1',
				opExt: 7
			},
			{
				seq: [0xD9, 0xFA],
				mnem: 'FSQRT',
				opExt: 7
			},
			{
				seq: [0xD9, 0xFB],
				mnem: 'FSINCOS',
				opExt: 7
			},
			{
				seq: [0xD9, 0xFC],
				mnem: 'FRNDINT',
				opExt: 7
			},
			{
				seq: [0xD9, 0xFD],
				mnem: 'FSCALE',
				opExt: 7
			},
			{
				seq: [0xD9, 0xFE],
				mnem: 'FSIN',
				opExt: 7
			},
			{
				seq: [0xD9, 0xFF],
				mnem: 'FCOS',
				opExt: 7
			},
			{
				seq: [0xDA],
				mnem: 'FIADD',
				opExt: 0,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDA],
				mnem: 'FCMOVB',
				opExt: 0,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDA],
				mnem: 'FIMUL',
				opExt: 1,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDA],
				mnem: 'FCMOVE',
				opExt: 1,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDA],
				mnem: 'FICOM',
				opExt: 2,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDA],
				mnem: 'FCMOVBE',
				opExt: 2,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDA],
				mnem: 'FICOMP',
				opExt: 3,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDA],
				mnem: 'FCMOVU',
				opExt: 3,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDA],
				mnem: 'FISUB',
				opExt: 4,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDA],
				mnem: 'FISUBR',
				opExt: 5,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDA, 0xE9],
				mnem: 'FUCOMPP',
				opExt: 5
			},
			{
				seq: [0xDA],
				mnem: 'FIDIV',
				opExt: 6,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDA],
				mnem: 'FIDIVR',
				opExt: 7,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDB],
				mnem: 'FILD',
				opExt: 0,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDB],
				mnem: 'FCMOVNB',
				opExt: 0,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDB],
				mnem: 'FISTTP',
				opExt: 1,
				instrExt: 'sse3',
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDB],
				mnem: 'FCMOVNE',
				opExt: 1,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDB],
				mnem: 'FIST',
				opExt: 2,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDB],
				mnem: 'FCMOVNBE',
				opExt: 2,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDB],
				mnem: 'FISTP',
				opExt: 3,
				operands: [{a: 'M', t: 'di'}]
			},
			{
				seq: [0xDB],
				mnem: 'FCMOVNU',
				opExt: 3,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDB, 0xE0],
				mnem: 'FNENI',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE0],
				mnem: 'FENI',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE0],
				mnem: 'FNENI',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE1],
				mnem: 'FNDISI',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE1],
				mnem: 'FDISI',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE1],
				mnem: 'FNDISI',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE2],
				mnem: 'FNCLEX',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE2],
				mnem: 'FCLEX',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE3],
				mnem: 'FNINIT',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE3],
				mnem: 'FINIT',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE4],
				mnem: 'FNSETPM',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE4],
				mnem: 'FSETPM',
				opExt: 4
			},
			{
				seq: [0xDB, 0xE4],
				mnem: 'FNSETPM',
				opExt: 4
			},
			{
				seq: [0xDB],
				mnem: 'FLD',
				opExt: 5,
				operands: [{a: 'M', t: 'er'}]
			},
			{
				seq: [0xDB],
				mnem: 'FUCOMI',
				opExt: 5,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDB],
				mnem: 'FCOMI',
				opExt: 6,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDB],
				mnem: 'FSTP',
				opExt: 7,
				operands: [{a: 'M', t: 'er'}]
			},
			{
				seq: [0xDC],
				mnem: 'FADD',
				opExt: 0,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDC],
				mnem: 'FADD',
				opExt: 0,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDC],
				mnem: 'FMUL',
				opExt: 1,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDC],
				mnem: 'FMUL',
				opExt: 1,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDC],
				mnem: 'FCOM',
				opExt: 2,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDC],
				mnem: 'FCOM2',
				opExt: 2,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDC],
				mnem: 'FCOM2',
				opExt: 2,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDC],
				mnem: 'FCOMP',
				opExt: 3,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDC],
				mnem: 'FCOMP3',
				opExt: 3,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDC],
				mnem: 'FCOMP3',
				opExt: 3,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDC],
				mnem: 'FSUB',
				opExt: 4,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDC],
				mnem: 'FSUBR',
				opExt: 4,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDC],
				mnem: 'FSUBR',
				opExt: 5,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDC],
				mnem: 'FSUB',
				opExt: 5,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDC],
				mnem: 'FDIV',
				opExt: 6,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDC],
				mnem: 'FDIVR',
				opExt: 6,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDC],
				mnem: 'FDIVR',
				opExt: 7,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDC],
				mnem: 'FDIV',
				opExt: 7,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDD],
				mnem: 'FLD',
				opExt: 0,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDD],
				mnem: 'FFREE',
				opExt: 0,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDD],
				mnem: 'FISTTP',
				opExt: 1,
				instrExt: 'sse3',
				operands: [{a: 'M', t: 'qi'}]
			},
			{
				seq: [0xDD],
				mnem: 'FXCH4',
				opExt: 1,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDD],
				mnem: 'FXCH4',
				opExt: 1,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDD],
				mnem: 'FST',
				opExt: 2,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDD],
				mnem: 'FST',
				opExt: 2,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDD],
				mnem: 'FSTP',
				opExt: 3,
				operands: [{a: 'M', t: 'dr'}]
			},
			{
				seq: [0xDD],
				mnem: 'FSTP',
				opExt: 3,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDD],
				mnem: 'FRSTOR',
				opExt: 4,
				operands: [{a: 'M', t: 'st'}]
			},
			{
				seq: [0xDD],
				mnem: 'FUCOM',
				opExt: 4,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDD, 0xE1],
				mnem: 'FUCOM',
				opExt: 4
			},
			{
				seq: [0xDD],
				mnem: 'FUCOMP',
				opExt: 5,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDD, 0xE9],
				mnem: 'FUCOMP',
				opExt: 5
			},
			{
				seq: [0xDD],
				mnem: 'FNSAVE',
				opExt: 6,
				operands: [{a: 'M', t: 'st'}]
			},
			{
				seq: [0xDD],
				mnem: 'FSAVE',
				opExt: 6,
				operands: [{a: 'M', t: 'st'}]
			},
			{
				seq: [0xDD],
				mnem: 'FNSTSW',
				opExt: 7,
				operands: [{a: 'M', t: 'w'}]
			},
			{
				seq: [0xDD],
				mnem: 'FSTSW',
				opExt: 7,
				operands: [{a: 'M', t: 'w'}]
			},
			{
				seq: [0xDE],
				mnem: 'FIADD',
				opExt: 0,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDE],
				mnem: 'FADDP',
				opExt: 0,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDE, 0xC1],
				mnem: 'FADDP',
				opExt: 0
			},
			{
				seq: [0xDE],
				mnem: 'FIMUL',
				opExt: 1,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDE],
				mnem: 'FMULP',
				opExt: 1,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDE, 0xC9],
				mnem: 'FMULP',
				opExt: 1
			},
			{
				seq: [0xDE],
				mnem: 'FICOM',
				opExt: 2,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDE],
				mnem: 'FCOMP5',
				opExt: 2,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDE],
				mnem: 'FCOMP5',
				opExt: 2,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDE],
				mnem: 'FICOMP',
				opExt: 3,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDE, 0xD9],
				mnem: 'FCOMPP',
				opExt: 3
			},
			{
				seq: [0xDE],
				mnem: 'FISUB',
				opExt: 4,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDE],
				mnem: 'FSUBRP',
				opExt: 4,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDE, 0xE1],
				mnem: 'FSUBRP',
				opExt: 4
			},
			{
				seq: [0xDE],
				mnem: 'FISUBR',
				opExt: 5,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDE],
				mnem: 'FSUBP',
				opExt: 5,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDE, 0xE9],
				mnem: 'FSUBP',
				opExt: 5
			},
			{
				seq: [0xDE],
				mnem: 'FIDIV',
				opExt: 6,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDE],
				mnem: 'FDIVRP',
				opExt: 6,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDE, 0xF1],
				mnem: 'FDIVRP',
				opExt: 6
			},
			{
				seq: [0xDE],
				mnem: 'FIDIVR',
				opExt: 7,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDE],
				mnem: 'FDIVP',
				opExt: 7,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDE, 0xF9],
				mnem: 'FDIVP',
				opExt: 7
			},
			{
				seq: [0xDF],
				mnem: 'FILD',
				opExt: 0,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDF],
				mnem: 'FFREEP',
				opExt: 0,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDF],
				mnem: 'FISTTP',
				opExt: 1,
				instrExt: 'sse3',
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDF],
				mnem: 'FXCH7',
				opExt: 1,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDF],
				mnem: 'FXCH7',
				opExt: 1,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDF],
				mnem: 'FIST',
				opExt: 2,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDF],
				mnem: 'FSTP8',
				opExt: 2,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDF],
				mnem: 'FSTP8',
				opExt: 2,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDF],
				mnem: 'FISTP',
				opExt: 3,
				operands: [{a: 'M', t: 'wi'}]
			},
			{
				seq: [0xDF],
				mnem: 'FSTP9',
				opExt: 3,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDF],
				mnem: 'FSTP9',
				opExt: 3,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDF],
				mnem: 'FBLD',
				opExt: 4,
				operands: [{a: 'M', t: 'bcd'}]
			},
			{
				seq: [0xDF, 0xE0],
				mnem: 'FNSTSW',
				opExt: 4,
				operands: [{r: DisASMx86.Registers[0], t: 'w'}]
			},
			{
				seq: [0xDF, 0xE0],
				mnem: 'FSTSW',
				opExt: 4,
				operands: [{r: DisASMx86.Registers[0], t: 'w'}]
			},
			{
				seq: [0xDF],
				mnem: 'FILD',
				opExt: 5,
				operands: [{a: 'M', t: 'qi'}]
			},
			{
				seq: [0xDF],
				mnem: 'FUCOMIP',
				opExt: 5,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDF],
				mnem: 'FBSTP',
				opExt: 6,
				operands: [{a: 'M', t: 'bcd'}]
			},
			{
				seq: [0xDF],
				mnem: 'FCOMIP',
				opExt: 6,
				operands: [{a: 'EST', t: null}]
			},
			{
				seq: [0xDF],
				mnem: 'FISTP',
				opExt: 7,
				operands: [{a: 'M', t: 'qi'}]
			},
			{
				seq: [0xE0],
				mnem: 'LOOPNZ',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0xE1],
				mnem: 'LOOPZ',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0xE2],
				mnem: 'LOOP',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0xE3],
				mnem: 'JCXZ',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0xE4],
				mnem: 'IN',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xE5],
				mnem: 'IN',
				operands: [{r: DisASMx86.Registers[0], t: 'v'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xE6],
				mnem: 'OUT',
				operands: [{a: 'I', t: 'b'}, {r: DisASMx86.Registers[0], t: 'b'}]
			},
			{
				seq: [0xE7],
				mnem: 'OUT',
				operands: [{a: 'I', t: 'b'}, {r: DisASMx86.Registers[0], t: 'v'}]
			},
			{
				seq: [0xE8],
				mnem: 'CALL',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0xE9],
				mnem: 'JMP',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0xEA],
				mnem: 'JMPF',
				operands: [{a: 'A', t: 'p'}]
			},
			{
				seq: [0xEB],
				mnem: 'JMP',
				operands: [{a: 'J', t: 'bs'}]
			},
			{
				seq: [0xEC],
				mnem: 'IN',
				operands: [{r: DisASMx86.Registers[0], t: 'b'}, {r: DisASMx86.Registers[2], t: 'w'}]
			},
			{
				seq: [0xED],
				mnem: 'IN',
				operands: [{r: DisASMx86.Registers[0], t: 'v'}, {r: DisASMx86.Registers[2], t: 'w'}]
			},
			{
				seq: [0xEE],
				mnem: 'OUT',
				operands: [{r: DisASMx86.Registers[2], t: 'w'}, {r: DisASMx86.Registers[0], t: 'b'}]
			},
			{
				seq: [0xEF],
				mnem: 'OUT',
				operands: [{r: DisASMx86.Registers[2], t: 'w'}, {r: DisASMx86.Registers[0], t: 'v'}]
			},
			{
				seq: [0xF0],
				mnem: 'LOCK'
			},
			{
				seq: [0xF1],
				mnem: 'INT1'
			},
			{
				seq: [0xF2],
				mnem: 'REPNZ'
			},
			{
				seq: [0xF2],
				mnem: 'REP'
			},
			{
				seq: [0xF3],
				mnem: 'REPZ'
			},
			{
				seq: [0xF3],
				mnem: 'REP'
			},
			{
				seq: [0xF4],
				mnem: 'HLT'
			},
			{
				seq: [0xF5],
				mnem: 'CMC'
			},
			{
				seq: [0xF6],
				mnem: 'TEST',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xF6],
				mnem: 'TEST',
				opExt: 1,
				operands: [{a: 'E', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0xF6],
				mnem: 'NOT',
				opExt: 2,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xF6],
				mnem: 'NEG',
				opExt: 3,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xF6],
				mnem: 'MUL',
				opExt: 4,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xF6],
				mnem: 'IMUL',
				opExt: 5,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xF6],
				mnem: 'DIV',
				opExt: 6,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xF6],
				mnem: 'IDIV',
				opExt: 7,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xF7],
				mnem: 'TEST',
				opExt: 0,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vqp'}]
			},
			{
				seq: [0xF7],
				mnem: 'TEST',
				opExt: 1,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'vqp'}]
			},
			{
				seq: [0xF7],
				mnem: 'NOT',
				opExt: 2,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xF7],
				mnem: 'NEG',
				opExt: 3,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xF7],
				mnem: 'MUL',
				opExt: 4,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xF7],
				mnem: 'IMUL',
				opExt: 5,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xF7],
				mnem: 'DIV',
				opExt: 6,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xF7],
				mnem: 'IDIV',
				opExt: 7,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xF8],
				mnem: 'CLC'
			},
			{
				seq: [0xF9],
				mnem: 'STC'
			},
			{
				seq: [0xFA],
				mnem: 'CLI'
			},
			{
				seq: [0xFB],
				mnem: 'STI'
			},
			{
				seq: [0xFC],
				mnem: 'CLD'
			},
			{
				seq: [0xFD],
				mnem: 'STD'
			},
			{
				seq: [0xFE],
				mnem: 'INC',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xFE],
				mnem: 'DEC',
				opExt: 1,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0xFF],
				mnem: 'INC',
				opExt: 0,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xFF],
				mnem: 'DEC',
				opExt: 1,
				operands: [{a: 'E', t: 'vqp'}]
			},
			{
				seq: [0xFF],
				mnem: 'CALL',
				opExt: 2,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0xFF],
				mnem: 'CALLF',
				opExt: 3,
				operands: [{a: 'M', t: 'ptp'}]
			},
			{
				seq: [0xFF],
				mnem: 'JMP',
				opExt: 4,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0xFF],
				mnem: 'JMPF',
				opExt: 5,
				operands: [{a: 'M', t: 'ptp'}]
			},
			{
				seq: [0xFF],
				mnem: 'PUSH',
				opExt: 6,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x00],
				mnem: 'SLDT',
				opExt: 0,
				operands: [{a: 'M', t: 'w'}]
			},
			{
				seq: [0x0F, 0x00],
				mnem: 'STR',
				opExt: 1,
				operands: [{a: 'M', t: 'w'}]
			},
			{
				seq: [0x0F, 0x00],
				mnem: 'LLDT',
				opExt: 2,
				operands: [{a: 'E', t: 'w'}]
			},
			{
				seq: [0x0F, 0x00],
				mnem: 'LTR',
				opExt: 3,
				operands: [{a: 'E', t: 'w'}]
			},
			{
				seq: [0x0F, 0x00],
				mnem: 'VERR',
				opExt: 4,
				operands: [{a: 'E', t: 'w'}]
			},
			{
				seq: [0x0F, 0x00],
				mnem: 'VERW',
				opExt: 5,
				operands: [{a: 'E', t: 'w'}]
			},
			{
				seq: [0x0F, 0x00],
				mnem: 'JMPE',
				opExt: 6
			},
			{
				seq: [0x0F, 0x01],
				mnem: 'SGDT',
				opExt: 0,
				operands: [{a: 'M', t: 's'}]
			},
			{
				seq: [0x0F, 0x01, 0xC1],
				mnem: 'VMCALL',
				opExt: 0,
				instrExt: 'vmx'
			},
			{
				seq: [0x0F, 0x01, 0xC2],
				mnem: 'VMLAUNCH',
				opExt: 0,
				instrExt: 'vmx'
			},
			{
				seq: [0x0F, 0x01, 0xC3],
				mnem: 'VMRESUME',
				opExt: 0,
				instrExt: 'vmx'
			},
			{
				seq: [0x0F, 0x01, 0xC4],
				mnem: 'VMXOFF',
				opExt: 0,
				instrExt: 'vmx'
			},
			{
				seq: [0x0F, 0x01],
				mnem: 'SIDT',
				opExt: 1,
				operands: [{a: 'M', t: 's'}]
			},
			{
				seq: [0x0F, 0x01, 0xC8],
				mnem: 'MONITOR',
				opExt: 1,
				instrExt: 'sse3'
			},
			{
				seq: [0x0F, 0x01, 0xC9],
				mnem: 'MWAIT',
				opExt: 1,
				instrExt: 'sse3'
			},
			{
				seq: [0x0F, 0x01],
				mnem: 'LGDT',
				opExt: 2,
				operands: [{a: 'M', t: 's'}]
			},
			{
				seq: [0x0F, 0x01, 0xD0],
				mnem: 'XGETBV',
				opExt: 2
			},
			{
				seq: [0x0F, 0x01, 0xD1],
				mnem: 'XSETBV',
				opExt: 2
			},
			{
				seq: [0x0F, 0x01],
				mnem: 'LIDT',
				opExt: 3,
				operands: [{a: 'M', t: 's'}]
			},
			{
				seq: [0x0F, 0x01],
				mnem: 'SMSW',
				opExt: 4,
				operands: [{a: 'M', t: 'w'}]
			},
			{
				seq: [0x0F, 0x01],
				mnem: 'LMSW',
				opExt: 6,
				operands: [{a: 'E', t: 'w'}]
			},
			{
				seq: [0x0F, 0x01],
				mnem: 'INVLPG',
				opExt: 7,
				operands: [{a: 'M', t: null}]
			},
			{
				seq: [0x0F, 0x01, 0xF9],
				mnem: 'RDTSCP',
				opExt: 7
			},
			{
				seq: [0x0F, 0x02],
				mnem: 'LAR',
				operands: [{a: 'G', t: 'vqp'}, {a: 'M', t: 'w'}]
			},
			{
				seq: [0x0F, 0x03],
				mnem: 'LSL',
				operands: [{a: 'G', t: 'vqp'}, {a: 'M', t: 'w'}]
			},
			{
				seq: [0x0F, 0x05],
				mnem: 'LOADALL'
			},
			{
				seq: [0x0F, 0x06],
				mnem: 'CLTS'
			},
			{
				seq: [0x0F, 0x07],
				mnem: 'LOADALL'
			},
			{
				seq: [0x0F, 0x08],
				mnem: 'INVD'
			},
			{
				seq: [0x0F, 0x09],
				mnem: 'WBINVD'
			},
			{
				seq: [0x0F, 0x0B],
				mnem: 'UD2'
			},
			{
				seq: [0x0F, 0x0D],
				mnem: 'NOP',
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x10],
				mnem: 'MOVUPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x10],
				mnem: 'MOVSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x10],
				mnem: 'MOVUPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x10],
				mnem: 'MOVSD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x11],
				mnem: 'MOVUPS',
				instrExt: 'sse1',
				operands: [{a: 'W', t: 'ps'}, {a: 'V', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x11],
				mnem: 'MOVSS',
				instrExt: 'sse1',
				operands: [{a: 'W', t: 'ss'}, {a: 'V', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x11],
				mnem: 'MOVUPD',
				instrExt: 'sse2',
				operands: [{a: 'W', t: 'pd'}, {a: 'V', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x11],
				mnem: 'MOVSD',
				instrExt: 'sse2',
				operands: [{a: 'W', t: 'sd'}, {a: 'V', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x12],
				mnem: 'MOVHLPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'q'}, {a: 'U', t: 'q'}]
			},
			{
				seq: [0x0F, 0x12],
				mnem: 'MOVLPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'q'}, {a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0x12],
				mnem: 'MOVLPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'q'}, {a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0x12],
				mnem: 'MOVDDUP',
				instrExt: 'sse3',
				operands: [{a: 'V', t: 'q'}, {a: 'W', t: 'q'}]
			},
			{
				seq: [0x0F, 0x12],
				mnem: 'MOVSLDUP',
				instrExt: 'sse3',
				operands: [{a: 'V', t: 'q'}, {a: 'W', t: 'q'}]
			},
			{
				seq: [0x0F, 0x13],
				mnem: 'MOVLPS',
				instrExt: 'sse1',
				operands: [{a: 'M', t: 'q'}, {a: 'V', t: 'q'}]
			},
			{
				seq: [0x0F, 0x13],
				mnem: 'MOVLPD',
				instrExt: 'sse2',
				operands: [{a: 'M', t: 'q'}, {a: 'V', t: 'q'}]
			},
			{
				seq: [0x0F, 0x14],
				mnem: 'UNPCKLPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'q'}]
			},
			{
				seq: [0x0F, 0x14],
				mnem: 'UNPCKLPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x15],
				mnem: 'UNPCKHPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'q'}]
			},
			{
				seq: [0x0F, 0x15],
				mnem: 'UNPCKHPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x16],
				mnem: 'MOVLHPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'q'}, {a: 'U', t: 'q'}]
			},
			{
				seq: [0x0F, 0x16],
				mnem: 'MOVHPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'q'}, {a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0x16],
				mnem: 'MOVHPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'q'}, {a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0x16],
				mnem: 'MOVSHDUP',
				instrExt: 'sse3',
				operands: [{a: 'V', t: 'q'}, {a: 'W', t: 'q'}]
			},
			{
				seq: [0x0F, 0x17],
				mnem: 'MOVHPS',
				instrExt: 'sse1',
				operands: [{a: 'M', t: 'q'}, {a: 'V', t: 'q'}]
			},
			{
				seq: [0x0F, 0x17],
				mnem: 'MOVHPD',
				instrExt: 'sse2',
				operands: [{a: 'M', t: 'q'}, {a: 'V', t: 'q'}]
			},
			{
				seq: [0x0F, 0x18],
				mnem: 'HINT_NOP',
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x18],
				mnem: 'PREFETCHNTA',
				opExt: 0,
				instrExt: 'sse1',
				operands: [{a: 'M', t: 'b'}]
			},
			{
				seq: [0x0F, 0x18],
				mnem: 'PREFETCHT0',
				opExt: 1,
				instrExt: 'sse1',
				operands: [{a: 'M', t: 'b'}]
			},
			{
				seq: [0x0F, 0x18],
				mnem: 'PREFETCHT1',
				opExt: 2,
				instrExt: 'sse1',
				operands: [{a: 'M', t: 'b'}]
			},
			{
				seq: [0x0F, 0x18],
				mnem: 'PREFETCHT2',
				opExt: 3,
				instrExt: 'sse1',
				operands: [{a: 'M', t: 'b'}]
			},
			{
				seq: [0x0F, 0x18],
				mnem: 'HINT_NOP',
				opExt: 4,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x18],
				mnem: 'HINT_NOP',
				opExt: 5,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x18],
				mnem: 'HINT_NOP',
				opExt: 6,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x18],
				mnem: 'HINT_NOP',
				opExt: 7,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x19],
				mnem: 'HINT_NOP',
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1A],
				mnem: 'HINT_NOP',
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1B],
				mnem: 'HINT_NOP',
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1C],
				mnem: 'HINT_NOP',
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1D],
				mnem: 'HINT_NOP',
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1E],
				mnem: 'HINT_NOP',
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1F],
				mnem: 'HINT_NOP',
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1F],
				mnem: 'NOP',
				opExt: 0,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1F],
				mnem: 'HINT_NOP',
				opExt: 1,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1F],
				mnem: 'HINT_NOP',
				opExt: 2,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1F],
				mnem: 'HINT_NOP',
				opExt: 3,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1F],
				mnem: 'HINT_NOP',
				opExt: 4,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1F],
				mnem: 'HINT_NOP',
				opExt: 5,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1F],
				mnem: 'HINT_NOP',
				opExt: 6,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x1F],
				mnem: 'HINT_NOP',
				opExt: 7,
				operands: [{a: 'E', t: 'v'}]
			},
			{
				seq: [0x0F, 0x20],
				mnem: 'MOV',
				operands: [{a: 'R', t: 'd'}, {a: 'C', t: 'd'}]
			},
			{
				seq: [0x0F, 0x20],
				mnem: 'MOV',
				operands: [{a: 'H', t: 'd'}, {a: 'C', t: 'd'}]
			},
			{
				seq: [0x0F, 0x21],
				mnem: 'MOV',
				operands: [{a: 'R', t: 'd'}, {a: 'D', t: 'd'}]
			},
			{
				seq: [0x0F, 0x21],
				mnem: 'MOV',
				operands: [{a: 'H', t: 'd'}, {a: 'D', t: 'd'}]
			},
			{
				seq: [0x0F, 0x22],
				mnem: 'MOV',
				operands: [{a: 'C', t: 'd'}, {a: 'R', t: 'd'}]
			},
			{
				seq: [0x0F, 0x22],
				mnem: 'MOV',
				operands: [{a: 'C', t: 'd'}, {a: 'H', t: 'd'}]
			},
			{
				seq: [0x0F, 0x23],
				mnem: 'MOV',
				operands: [{a: 'D', t: 'd'}, {a: 'R', t: 'd'}]
			},
			{
				seq: [0x0F, 0x23],
				mnem: 'MOV',
				operands: [{a: 'D', t: 'q'}, {a: 'H', t: 'q'}]
			},
			{
				seq: [0x0F, 0x24],
				mnem: 'MOV',
				operands: [{a: 'R', t: 'd'}, {a: 'T', t: 'd'}]
			},
			{
				seq: [0x0F, 0x24],
				mnem: 'MOV',
				operands: [{a: 'H', t: 'd'}, {a: 'T', t: 'd'}]
			},
			{
				seq: [0x0F, 0x26],
				mnem: 'MOV',
				operands: [{a: 'T', t: 'd'}, {a: 'R', t: 'd'}]
			},
			{
				seq: [0x0F, 0x26],
				mnem: 'MOV',
				operands: [{a: 'T', t: 'd'}, {a: 'H', t: 'd'}]
			},
			{
				seq: [0x0F, 0x28],
				mnem: 'MOVAPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x28],
				mnem: 'MOVAPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x29],
				mnem: 'MOVAPS',
				instrExt: 'sse1',
				operands: [{a: 'W', t: 'ps'}, {a: 'V', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x29],
				mnem: 'MOVAPD',
				instrExt: 'sse2',
				operands: [{a: 'W', t: 'pd'}, {a: 'V', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x2A],
				mnem: 'CVTPI2PS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'Q', t: 'pi'}]
			},
			{
				seq: [0x0F, 0x2A],
				mnem: 'CVTSI2SS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'E', t: 'dqp'}]
			},
			{
				seq: [0x0F, 0x2A],
				mnem: 'CVTPI2PD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'Q', t: 'pi'}]
			},
			{
				seq: [0x0F, 0x2A],
				mnem: 'CVTSI2SD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'E', t: 'dqp'}]
			},
			{
				seq: [0x0F, 0x2B],
				mnem: 'MOVNTPS',
				instrExt: 'sse1',
				operands: [{a: 'M', t: 'ps'}, {a: 'V', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x2B],
				mnem: 'MOVNTPD',
				instrExt: 'sse2',
				operands: [{a: 'M', t: 'pd'}, {a: 'V', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x2C],
				mnem: 'CVTTPS2PI',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'pi'}, {a: 'W', t: 'psq'}]
			},
			{
				seq: [0x0F, 0x2C],
				mnem: 'CVTTSS2SI',
				instrExt: 'sse1',
				operands: [{a: 'G', t: 'dqp'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x2C],
				mnem: 'CVTTPD2PI',
				instrExt: 'sse2',
				operands: [{a: 'P', t: 'pi'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x2C],
				mnem: 'CVTTSD2SI',
				instrExt: 'sse2',
				operands: [{a: 'G', t: 'dqp'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x2D],
				mnem: 'CVTPS2PI',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'pi'}, {a: 'W', t: 'psq'}]
			},
			{
				seq: [0x0F, 0x2D],
				mnem: 'CVTSS2SI',
				instrExt: 'sse1',
				operands: [{a: 'G', t: 'dqp'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x2D],
				mnem: 'CVTPD2PI',
				instrExt: 'sse2',
				operands: [{a: 'P', t: 'pi'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x2D],
				mnem: 'CVTSD2SI',
				instrExt: 'sse2',
				operands: [{a: 'G', t: 'dqp'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x2E],
				mnem: 'UCOMISS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x2E],
				mnem: 'UCOMISD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x2F],
				mnem: 'COMISS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x2F],
				mnem: 'COMISD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x30],
				mnem: 'WRMSR'
			},
			{
				seq: [0x0F, 0x31],
				mnem: 'RDTSC'
			},
			{
				seq: [0x0F, 0x32],
				mnem: 'RDMSR'
			},
			{
				seq: [0x0F, 0x33],
				mnem: 'RDPMC'
			},
			{
				seq: [0x0F, 0x34],
				mnem: 'SYSENTER'
			},
			{
				seq: [0x0F, 0x35],
				mnem: 'SYSEXIT'
			},
			{
				seq: [0x0F, 0x37],
				mnem: 'GETSEC',
				instrExt: 'smx'
			},
			{
				seq: [0x0F, 0x38, 0x00],
				mnem: 'PSHUFB',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x00],
				mnem: 'PSHUFB',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x01],
				mnem: 'PHADDW',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x01],
				mnem: 'PHADDW',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x02],
				mnem: 'PHADDD',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x02],
				mnem: 'PHADDD',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x03],
				mnem: 'PHADDSW',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x03],
				mnem: 'PHADDSW',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x04],
				mnem: 'PMADDUBSW',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x04],
				mnem: 'PMADDUBSW',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x05],
				mnem: 'PHSUBW',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x05],
				mnem: 'PHSUBW',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x06],
				mnem: 'PHSUBD',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x06],
				mnem: 'PHSUBD',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x07],
				mnem: 'PHSUBSW',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x07],
				mnem: 'PHSUBSW',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x08],
				mnem: 'PSIGNB',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x08],
				mnem: 'PSIGNB',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x09],
				mnem: 'PSIGNW',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x09],
				mnem: 'PSIGNW',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x0A],
				mnem: 'PSIGND',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x0A],
				mnem: 'PSIGND',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x0B],
				mnem: 'PMULHRSW',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x0B],
				mnem: 'PMULHRSW',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x10],
				mnem: 'PBLENDVB',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x14],
				mnem: 'BLENDVPS',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x38, 0x15],
				mnem: 'BLENDVPD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x38, 0x17],
				mnem: 'PTEST',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x1C],
				mnem: 'PABSB',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x1C],
				mnem: 'PABSB',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x1D],
				mnem: 'PABSW',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x1D],
				mnem: 'PABSW',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x1E],
				mnem: 'PABSD',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x1E],
				mnem: 'PABSD',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x20],
				mnem: 'PMOVSXBW',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x21],
				mnem: 'PMOVSXBD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'd'}]
			},
			{
				seq: [0x0F, 0x38, 0x22],
				mnem: 'PMOVSXBQ',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'w'}]
			},
			{
				seq: [0x0F, 0x38, 0x23],
				mnem: 'PMOVSXWD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x24],
				mnem: 'PMOVSXWQ',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'd'}]
			},
			{
				seq: [0x0F, 0x38, 0x25],
				mnem: 'PMOVSXDQ',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x28],
				mnem: 'PMULDQ',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x29],
				mnem: 'PCMPEQQ',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x2A],
				mnem: 'MOVNTDQA',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x2B],
				mnem: 'PACKUSDW',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x30],
				mnem: 'PMOVZXBW',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x31],
				mnem: 'PMOVZXBD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'd'}]
			},
			{
				seq: [0x0F, 0x38, 0x32],
				mnem: 'PMOVZXBQ',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'w'}]
			},
			{
				seq: [0x0F, 0x38, 0x33],
				mnem: 'PMOVZXWD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x34],
				mnem: 'PMOVZXWQ',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'd'}]
			},
			{
				seq: [0x0F, 0x38, 0x35],
				mnem: 'PMOVZXDQ',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0x38, 0x37],
				mnem: 'PCMPGTQ',
				instrExt: 'sse42',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x38],
				mnem: 'PMINSB',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x39],
				mnem: 'PMINSD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x3A],
				mnem: 'PMINUW',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x3B],
				mnem: 'PMINUD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x3C],
				mnem: 'PMAXSB',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x3D],
				mnem: 'PMAXSD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x3E],
				mnem: 'PMAXUW',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x3F],
				mnem: 'PMAXUD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x40],
				mnem: 'PMULLD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x41],
				mnem: 'PHMINPOSUW',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x80],
				mnem: 'INVEPT',
				instrExt: 'vmx',
				operands: [{a: 'G', t: 'd'}, {a: 'M', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0x81],
				mnem: 'INVVPID',
				instrExt: 'vmx',
				operands: [{a: 'G', t: 'd'}, {a: 'M', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x38, 0xF0],
				mnem: 'MOVBE',
				operands: [{a: 'G', t: 'vqp'}, {a: 'M', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x38, 0xF0],
				mnem: 'CRC32',
				instrExt: 'sse42',
				operands: [{a: 'G', t: 'dqp'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x38, 0xF1],
				mnem: 'MOVBE',
				operands: [{a: 'M', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x38, 0xF1],
				mnem: 'CRC32',
				instrExt: 'sse42',
				operands: [{a: 'G', t: 'dqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x3A, 0x08],
				mnem: 'ROUNDPS',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x09],
				mnem: 'ROUNDPD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'pd'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x0A],
				mnem: 'ROUNDSS',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x0B],
				mnem: 'ROUNDSD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x0C],
				mnem: 'BLENDPS',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x0D],
				mnem: 'BLENDPD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x0E],
				mnem: 'PBLENDW',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x0F],
				mnem: 'PALIGNR',
				instrExt: 'ssse3',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x3A, 0x0F],
				mnem: 'PALIGNR',
				instrExt: 'ssse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x3A, 0x14],
				mnem: 'PEXTRB',
				instrExt: 'sse41',
				operands: [{a: 'M', t: 'b'}, {a: 'V', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x15],
				mnem: 'PEXTRW',
				instrExt: 'sse41',
				operands: [{a: 'M', t: 'w'}, {a: 'V', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x16],
				mnem: 'PEXTRD',
				instrExt: 'sse41',
				operands: [{a: 'E', t: 'd'}, {a: 'V', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x17],
				mnem: 'EXTRACTPS',
				instrExt: 'sse41',
				operands: [{a: 'E', t: 'd'}, {a: 'V', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x20],
				mnem: 'PINSRB',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'b'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x21],
				mnem: 'INSERTPS',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'ps'}, {a: 'U', t: 'ps'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x22],
				mnem: 'PINSRD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'E', t: 'd'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x40],
				mnem: 'DPPS',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x3A, 0x41],
				mnem: 'DPPD',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x3A, 0x42],
				mnem: 'MPSADBW',
				instrExt: 'sse41',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x60],
				mnem: 'PCMPESTRM',
				instrExt: 'sse42',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x61],
				mnem: 'PCMPESTRI',
				instrExt: 'sse42',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x62],
				mnem: 'PCMPISTRM',
				instrExt: 'sse42',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x3A, 0x63],
				mnem: 'PCMPISTRI',
				instrExt: 'sse42',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x40],
				mnem: 'CMOVO',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x41],
				mnem: 'CMOVNO',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x42],
				mnem: 'CMOVB',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x43],
				mnem: 'CMOVNB',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x44],
				mnem: 'CMOVZ',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x45],
				mnem: 'CMOVNZ',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x46],
				mnem: 'CMOVBE',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x47],
				mnem: 'CMOVNBE',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x48],
				mnem: 'CMOVS',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x49],
				mnem: 'CMOVNS',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x4A],
				mnem: 'CMOVP',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x4B],
				mnem: 'CMOVNP',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x4C],
				mnem: 'CMOVL',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x4D],
				mnem: 'CMOVNL',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x4E],
				mnem: 'CMOVLE',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x4F],
				mnem: 'CMOVNLE',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0x50],
				mnem: 'MOVMSKPS',
				instrExt: 'sse1',
				operands: [{a: 'G', t: 'dqp'}, {a: 'U', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x50],
				mnem: 'MOVMSKPD',
				instrExt: 'sse2',
				operands: [{a: 'G', t: 'dqp'}, {a: 'U', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x51],
				mnem: 'SQRTPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x51],
				mnem: 'SQRTSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x51],
				mnem: 'SQRTPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x51],
				mnem: 'SQRTSD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x52],
				mnem: 'RSQRTPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x52],
				mnem: 'RSQRTSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x53],
				mnem: 'RCPPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x53],
				mnem: 'RCPSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x54],
				mnem: 'ANDPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x54],
				mnem: 'ANDPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x55],
				mnem: 'ANDNPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x55],
				mnem: 'ANDNPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x56],
				mnem: 'ORPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x56],
				mnem: 'ORPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x57],
				mnem: 'XORPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x57],
				mnem: 'XORPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x58],
				mnem: 'ADDPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x58],
				mnem: 'ADDSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x58],
				mnem: 'ADDPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x58],
				mnem: 'ADDSD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x59],
				mnem: 'MULPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x59],
				mnem: 'MULSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x59],
				mnem: 'MULPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x59],
				mnem: 'MULSD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x5A],
				mnem: 'CVTPS2PD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x5A],
				mnem: 'CVTPD2PS',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x5A],
				mnem: 'CVTSS2SD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x5A],
				mnem: 'CVTSD2SS',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x5B],
				mnem: 'CVTDQ2PS',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x5B],
				mnem: 'CVTPS2DQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x5B],
				mnem: 'CVTTPS2DQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x5C],
				mnem: 'SUBPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x5C],
				mnem: 'SUBSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x5C],
				mnem: 'SUBPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x5C],
				mnem: 'SUBSD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x5D],
				mnem: 'MINPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x5D],
				mnem: 'MINSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x5D],
				mnem: 'MINPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x5D],
				mnem: 'MINSD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x5E],
				mnem: 'DIVPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x5E],
				mnem: 'DIVSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x5E],
				mnem: 'DIVPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x5E],
				mnem: 'DIVSD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x5F],
				mnem: 'MAXPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x5F],
				mnem: 'MAXSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}]
			},
			{
				seq: [0x0F, 0x5F],
				mnem: 'MAXPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x5F],
				mnem: 'MAXSD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}]
			},
			{
				seq: [0x0F, 0x60],
				mnem: 'PUNPCKLBW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'd'}]
			},
			{
				seq: [0x0F, 0x60],
				mnem: 'PUNPCKLBW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x61],
				mnem: 'PUNPCKLWD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'd'}]
			},
			{
				seq: [0x0F, 0x61],
				mnem: 'PUNPCKLWD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x62],
				mnem: 'PUNPCKLDQ',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'd'}]
			},
			{
				seq: [0x0F, 0x62],
				mnem: 'PUNPCKLDQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x63],
				mnem: 'PACKSSWB',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'd'}]
			},
			{
				seq: [0x0F, 0x63],
				mnem: 'PACKSSWB',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x64],
				mnem: 'PCMPGTB',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'd'}]
			},
			{
				seq: [0x0F, 0x64],
				mnem: 'PCMPGTB',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x65],
				mnem: 'PCMPGTW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'd'}]
			},
			{
				seq: [0x0F, 0x65],
				mnem: 'PCMPGTW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x66],
				mnem: 'PCMPGTD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'd'}]
			},
			{
				seq: [0x0F, 0x66],
				mnem: 'PCMPGTD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x67],
				mnem: 'PACKUSWB',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x67],
				mnem: 'PACKUSWB',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x68],
				mnem: 'PUNPCKHBW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x68],
				mnem: 'PUNPCKHBW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x69],
				mnem: 'PUNPCKHWD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x69],
				mnem: 'PUNPCKHWD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x6A],
				mnem: 'PUNPCKHDQ',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x6A],
				mnem: 'PUNPCKHDQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x6B],
				mnem: 'PACKSSDW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x6B],
				mnem: 'PACKSSDW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x6C],
				mnem: 'PUNPCKLQDQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x6D],
				mnem: 'PUNPCKHQDQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x6E],
				mnem: 'MOVD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'E', t: 'd'}]
			},
			{
				seq: [0x0F, 0x6E],
				mnem: 'MOVD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'E', t: 'd'}]
			},
			{
				seq: [0x0F, 0x6F],
				mnem: 'MOVQ',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x6F],
				mnem: 'MOVDQA',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x6F],
				mnem: 'MOVDQU',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x70],
				mnem: 'PSHUFW',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x70],
				mnem: 'PSHUFLW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x70],
				mnem: 'PSHUFHW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x70],
				mnem: 'PSHUFD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x71],
				mnem: 'PSRLW',
				opExt: 2,
				instrExt: 'mmx',
				operands: [{a: 'N', t: 'q'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x71],
				mnem: 'PSRLW',
				opExt: 2,
				instrExt: 'sse2',
				operands: [{a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x71],
				mnem: 'PSRAW',
				opExt: 4,
				instrExt: 'mmx',
				operands: [{a: 'N', t: 'q'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x71],
				mnem: 'PSRAW',
				opExt: 4,
				instrExt: 'sse2',
				operands: [{a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x71],
				mnem: 'PSLLW',
				opExt: 6,
				instrExt: 'mmx',
				operands: [{a: 'N', t: 'q'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x71],
				mnem: 'PSLLW',
				opExt: 6,
				instrExt: 'sse2',
				operands: [{a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x72],
				mnem: 'PSRLD',
				opExt: 2,
				instrExt: 'mmx',
				operands: [{a: 'N', t: 'q'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x72],
				mnem: 'PSRLD',
				opExt: 2,
				instrExt: 'sse2',
				operands: [{a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x72],
				mnem: 'PSRAD',
				opExt: 4,
				instrExt: 'mmx',
				operands: [{a: 'N', t: 'q'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x72],
				mnem: 'PSRAD',
				opExt: 4,
				instrExt: 'sse2',
				operands: [{a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x72],
				mnem: 'PSLLD',
				opExt: 6,
				instrExt: 'mmx',
				operands: [{a: 'N', t: 'q'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x72],
				mnem: 'PSLLD',
				opExt: 6,
				instrExt: 'sse2',
				operands: [{a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x73],
				mnem: 'PSRLQ',
				opExt: 2,
				instrExt: 'mmx',
				operands: [{a: 'N', t: 'q'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x73],
				mnem: 'PSRLQ',
				opExt: 2,
				instrExt: 'sse2',
				operands: [{a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x73],
				mnem: 'PSRLDQ',
				opExt: 3,
				instrExt: 'sse2',
				operands: [{a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x73],
				mnem: 'PSLLQ',
				opExt: 6,
				instrExt: 'mmx',
				operands: [{a: 'N', t: 'q'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x73],
				mnem: 'PSLLQ',
				opExt: 6,
				instrExt: 'sse2',
				operands: [{a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x73],
				mnem: 'PSLLDQ',
				opExt: 7,
				instrExt: 'sse2',
				operands: [{a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0x74],
				mnem: 'PCMPEQB',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x74],
				mnem: 'PCMPEQB',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x75],
				mnem: 'PCMPEQW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x75],
				mnem: 'PCMPEQW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x76],
				mnem: 'PCMPEQD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0x76],
				mnem: 'PCMPEQD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x77],
				mnem: 'EMMS',
				instrExt: 'mmx'
			},
			{
				seq: [0x0F, 0x78],
				mnem: 'VMREAD',
				instrExt: 'vmx',
				operands: [{a: 'E', t: 'd'}, {a: 'G', t: 'd'}]
			},
			{
				seq: [0x0F, 0x79],
				mnem: 'VMWRITE',
				instrExt: 'vmx',
				operands: [{a: 'G', t: 'd'}, {a: 'E', t: 'd'}]
			},
			{
				seq: [0x0F, 0x7C],
				mnem: 'HADDPD',
				instrExt: 'sse3',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x7C],
				mnem: 'HADDPS',
				instrExt: 'sse3',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x7D],
				mnem: 'HSUBPD',
				instrExt: 'sse3',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0x7D],
				mnem: 'HSUBPS',
				instrExt: 'sse3',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0x7E],
				mnem: 'MOVD',
				instrExt: 'mmx',
				operands: [{a: 'E', t: 'd'}, {a: 'P', t: 'q'}]
			},
			{
				seq: [0x0F, 0x7E],
				mnem: 'MOVD',
				instrExt: 'sse2',
				operands: [{a: 'E', t: 'd'}, {a: 'V', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x7E],
				mnem: 'MOVQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'q'}, {a: 'W', t: 'q'}]
			},
			{
				seq: [0x0F, 0x7F],
				mnem: 'MOVQ',
				instrExt: 'mmx',
				operands: [{a: 'Q', t: 'q'}, {a: 'P', t: 'q'}]
			},
			{
				seq: [0x0F, 0x7F],
				mnem: 'MOVDQA',
				instrExt: 'sse2',
				operands: [{a: 'W', t: 'dq'}, {a: 'V', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x7F],
				mnem: 'MOVDQU',
				instrExt: 'sse2',
				operands: [{a: 'W', t: 'dq'}, {a: 'V', t: 'dq'}]
			},
			{
				seq: [0x0F, 0x80],
				mnem: 'JO',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x81],
				mnem: 'JNO',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x82],
				mnem: 'JB',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x83],
				mnem: 'JNB',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x84],
				mnem: 'JZ',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x85],
				mnem: 'JNZ',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x86],
				mnem: 'JBE',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x87],
				mnem: 'JNBE',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x88],
				mnem: 'JS',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x89],
				mnem: 'JNS',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x8A],
				mnem: 'JP',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x8B],
				mnem: 'JNP',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x8C],
				mnem: 'JL',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x8D],
				mnem: 'JNL',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x8E],
				mnem: 'JLE',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x8F],
				mnem: 'JNLE',
				operands: [{a: 'J', t: 'vds'}]
			},
			{
				seq: [0x0F, 0x90],
				mnem: 'SETO',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x91],
				mnem: 'SETNO',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x92],
				mnem: 'SETB',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x93],
				mnem: 'SETNB',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x94],
				mnem: 'SETZ',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x95],
				mnem: 'SETNZ',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x96],
				mnem: 'SETBE',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x97],
				mnem: 'SETNBE',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x98],
				mnem: 'SETS',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x99],
				mnem: 'SETNS',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x9A],
				mnem: 'SETP',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x9B],
				mnem: 'SETNP',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x9C],
				mnem: 'SETL',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x9D],
				mnem: 'SETNL',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x9E],
				mnem: 'SETLE',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0x9F],
				mnem: 'SETNLE',
				opExt: 0,
				operands: [{a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0xA0],
				mnem: 'PUSH',
				operands: [{r: DisASMx86.Registers[12], t: 'w'}]
			},
			{
				seq: [0x0F, 0xA1],
				mnem: 'POP',
				operands: [{r: DisASMx86.Registers[12], t: 'w'}]
			},
			{
				seq: [0x0F, 0xA2],
				mnem: 'CPUID'
			},
			{
				seq: [0x0F, 0xA3],
				mnem: 'BT',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xA4],
				mnem: 'SHLD',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xA5],
				mnem: 'SHLD',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0x0F, 0xA8],
				mnem: 'PUSH',
				operands: [{r: DisASMx86.Registers[13], t: 'w'}]
			},
			{
				seq: [0x0F, 0xA9],
				mnem: 'POP',
				operands: [{r: DisASMx86.Registers[13], t: 'w'}]
			},
			{
				seq: [0x0F, 0xAA],
				mnem: 'RSM'
			},
			{
				seq: [0x0F, 0xAB],
				mnem: 'BTS',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xAC],
				mnem: 'SHRD',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xAD],
				mnem: 'SHRD',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}, {r: DisASMx86.Registers[1], t: 'b'}]
			},
			{
				seq: [0x0F, 0xAE],
				mnem: 'FXSAVE',
				opExt: 0,
				operands: [{a: 'M', t: 'stx'}]
			},
			{
				seq: [0x0F, 0xAE],
				mnem: 'FXRSTOR',
				opExt: 1,
				operands: [{a: 'M', t: 'stx'}]
			},
			{
				seq: [0x0F, 0xAE],
				mnem: 'LDMXCSR',
				opExt: 2,
				instrExt: 'sse1',
				operands: [{a: 'M', t: 'd'}]
			},
			{
				seq: [0x0F, 0xAE],
				mnem: 'STMXCSR',
				opExt: 3,
				instrExt: 'sse1',
				operands: [{a: 'M', t: 'd'}]
			},
			{
				seq: [0x0F, 0xAE],
				mnem: 'XSAVE',
				opExt: 4,
				operands: [{a: 'M', t: null}]
			},
			{
				seq: [0x0F, 0xAE],
				mnem: 'LFENCE',
				opExt: 5,
				instrExt: 'sse2'
			},
			{
				seq: [0x0F, 0xAE],
				mnem: 'XRSTOR',
				opExt: 5,
				operands: [{a: 'M', t: null}]
			},
			{
				seq: [0x0F, 0xAE],
				mnem: 'MFENCE',
				opExt: 6,
				instrExt: 'sse2'
			},
			{
				seq: [0x0F, 0xAE],
				mnem: 'SFENCE',
				opExt: 7,
				instrExt: 'sse1'
			},
			{
				seq: [0x0F, 0xAE],
				mnem: 'CLFLUSH',
				opExt: 7,
				instrExt: 'sse2',
				operands: [{a: 'M', t: 'b'}]
			},
			{
				seq: [0x0F, 0xAF],
				mnem: 'IMUL',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xB0],
				mnem: 'CMPXCHG',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x0F, 0xB1],
				mnem: 'CMPXCHG',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xB2],
				mnem: 'LSS',
				operands: [{a: 'G', t: 'vqp'}, {a: 'M', t: 'ptp'}]
			},
			{
				seq: [0x0F, 0xB3],
				mnem: 'BTR',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xB4],
				mnem: 'LFS',
				operands: [{a: 'G', t: 'vqp'}, {a: 'M', t: 'ptp'}]
			},
			{
				seq: [0x0F, 0xB5],
				mnem: 'LGS',
				operands: [{a: 'G', t: 'vqp'}, {a: 'M', t: 'ptp'}]
			},
			{
				seq: [0x0F, 0xB6],
				mnem: 'MOVZX',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0xB7],
				mnem: 'MOVZX',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'w'}]
			},
			{
				seq: [0x0F, 0xB8],
				mnem: 'JMPE'
			},
			{
				seq: [0x0F, 0xB8],
				mnem: 'POPCNT',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xB9],
				mnem: 'UD',
				operands: [{a: 'G', t: null}, {a: 'E', t: null}]
			},
			{
				seq: [0x0F, 0xBA],
				mnem: 'BT',
				opExt: 4,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xBA],
				mnem: 'BTS',
				opExt: 5,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xBA],
				mnem: 'BTR',
				opExt: 6,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xBA],
				mnem: 'BTC',
				opExt: 7,
				operands: [{a: 'E', t: 'vqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xBB],
				mnem: 'BTC',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xBC],
				mnem: 'BSF',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xBD],
				mnem: 'BSR',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xBE],
				mnem: 'MOVSX',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'b'}]
			},
			{
				seq: [0x0F, 0xBF],
				mnem: 'MOVSX',
				operands: [{a: 'G', t: 'vqp'}, {a: 'E', t: 'w'}]
			},
			{
				seq: [0x0F, 0xC0],
				mnem: 'XADD',
				operands: [{a: 'E', t: 'b'}, {a: 'G', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC1],
				mnem: 'XADD',
				operands: [{a: 'E', t: 'vqp'}, {a: 'G', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xC2],
				mnem: 'CMPPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC2],
				mnem: 'CMPSS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ss'}, {a: 'W', t: 'ss'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC2],
				mnem: 'CMPPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC2],
				mnem: 'CMPSD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'sd'}, {a: 'W', t: 'sd'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC3],
				mnem: 'MOVNTI',
				instrExt: 'sse2',
				operands: [{a: 'M', t: 'dqp'}, {a: 'G', t: 'dqp'}]
			},
			{
				seq: [0x0F, 0xC4],
				mnem: 'PINSRW',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'R', t: 'dqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC4],
				mnem: 'PINSRW',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'dq'}, {a: 'R', t: 'dqp'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC5],
				mnem: 'PEXTRW',
				instrExt: 'sse1',
				operands: [{a: 'G', t: 'dqp'}, {a: 'N', t: 'q'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC5],
				mnem: 'PEXTRW',
				instrExt: 'sse1',
				operands: [{a: 'G', t: 'dqp'}, {a: 'U', t: 'dq'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC6],
				mnem: 'SHUFPS',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC6],
				mnem: 'SHUFPD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}, {a: 'I', t: 'b'}]
			},
			{
				seq: [0x0F, 0xC7],
				mnem: 'CMPXCHG8B',
				opExt: 1,
				operands: [{a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0xC7],
				mnem: 'VMPTRLD',
				opExt: 6,
				instrExt: 'vmx',
				operands: [{a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0xC7],
				mnem: 'VMCLEAR',
				opExt: 6,
				instrExt: 'vmx',
				operands: [{a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0xC7],
				mnem: 'VMXON',
				opExt: 6,
				instrExt: 'vmx',
				operands: [{a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0xC7],
				mnem: 'VMPTRST',
				opExt: 7,
				instrExt: 'vmx',
				operands: [{a: 'M', t: 'q'}]
			},
			{
				seq: [0x0F, 0xC8],
				mnem: 'BSWAP',
				operands: [{a: 'Z', t: 'vqp'}]
			},
			{
				seq: [0x0F, 0xD0],
				mnem: 'ADDSUBPD',
				instrExt: 'sse3',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0xD0],
				mnem: 'ADDSUBPS',
				instrExt: 'sse3',
				operands: [{a: 'V', t: 'ps'}, {a: 'W', t: 'ps'}]
			},
			{
				seq: [0x0F, 0xD1],
				mnem: 'PSRLW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD1],
				mnem: 'PSRLW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xD2],
				mnem: 'PSRLD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD2],
				mnem: 'PSRLD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xD3],
				mnem: 'PSRLQ',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD3],
				mnem: 'PSRLQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xD4],
				mnem: 'PADDQ',
				instrExt: 'sse2',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD4],
				mnem: 'PADDQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xD5],
				mnem: 'PMULLW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD5],
				mnem: 'PMULLW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xD6],
				mnem: 'MOVQ',
				instrExt: 'sse2',
				operands: [{a: 'W', t: 'q'}, {a: 'V', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD6],
				mnem: 'MOVQ2DQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'N', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD6],
				mnem: 'MOVDQ2Q',
				instrExt: 'sse2',
				operands: [{a: 'P', t: 'q'}, {a: 'U', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD7],
				mnem: 'PMOVMSKB',
				instrExt: 'sse1',
				operands: [{a: 'G', t: 'dqp'}, {a: 'N', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD7],
				mnem: 'PMOVMSKB',
				instrExt: 'sse1',
				operands: [{a: 'G', t: 'dqp'}, {a: 'U', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xD8],
				mnem: 'PSUBUSB',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD8],
				mnem: 'PSUBUSB',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xD9],
				mnem: 'PSUBUSW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xD9],
				mnem: 'PSUBUSW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xDA],
				mnem: 'PMINUB',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xDA],
				mnem: 'PMINUB',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xDB],
				mnem: 'PAND',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'd'}]
			},
			{
				seq: [0x0F, 0xDB],
				mnem: 'PAND',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xDC],
				mnem: 'PADDUSB',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xDC],
				mnem: 'PADDUSB',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xDD],
				mnem: 'PADDUSW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xDD],
				mnem: 'PADDUSW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xDE],
				mnem: 'PMAXUB',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xDE],
				mnem: 'PMAXUB',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xDF],
				mnem: 'PANDN',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xDF],
				mnem: 'PANDN',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xE0],
				mnem: 'PAVGB',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xE0],
				mnem: 'PAVGB',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xE1],
				mnem: 'PSRAW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xE1],
				mnem: 'PSRAW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xE2],
				mnem: 'PSRAD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xE2],
				mnem: 'PSRAD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xE3],
				mnem: 'PAVGW',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xE3],
				mnem: 'PAVGW',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xE4],
				mnem: 'PMULHUW',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xE4],
				mnem: 'PMULHUW',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xE5],
				mnem: 'PMULHW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xE5],
				mnem: 'PMULHW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xE6],
				mnem: 'CVTPD2DQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0xE6],
				mnem: 'CVTTPD2DQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'pd'}]
			},
			{
				seq: [0x0F, 0xE6],
				mnem: 'CVTDQ2PD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'pd'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xE7],
				mnem: 'MOVNTQ',
				instrExt: 'sse1',
				operands: [{a: 'M', t: 'q'}, {a: 'P', t: 'q'}]
			},
			{
				seq: [0x0F, 0xE7],
				mnem: 'MOVNTDQ',
				instrExt: 'sse2',
				operands: [{a: 'M', t: 'dq'}, {a: 'V', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xE8],
				mnem: 'PSUBSB',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xE8],
				mnem: 'PSUBSB',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xE9],
				mnem: 'PSUBSW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xE9],
				mnem: 'PSUBSW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xEA],
				mnem: 'PMINSW',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xEA],
				mnem: 'PMINSW',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xEB],
				mnem: 'POR',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xEB],
				mnem: 'POR',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xEC],
				mnem: 'PADDSB',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xEC],
				mnem: 'PADDSB',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xED],
				mnem: 'PADDSW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xED],
				mnem: 'PADDSW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xEE],
				mnem: 'PMAXSW',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xEE],
				mnem: 'PMAXSW',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xEF],
				mnem: 'PXOR',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xEF],
				mnem: 'PXOR',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xF0],
				mnem: 'LDDQU',
				instrExt: 'sse3',
				operands: [{a: 'V', t: 'dq'}, {a: 'M', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xF1],
				mnem: 'PSLLW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xF1],
				mnem: 'PSLLW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xF2],
				mnem: 'PSLLD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xF2],
				mnem: 'PSLLD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xF3],
				mnem: 'PSLLQ',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xF3],
				mnem: 'PSLLQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xF4],
				mnem: 'PMULUDQ',
				instrExt: 'sse2',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xF4],
				mnem: 'PMULUDQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xF5],
				mnem: 'PMADDWD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'd'}]
			},
			{
				seq: [0x0F, 0xF5],
				mnem: 'PMADDWD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xF6],
				mnem: 'PSADBW',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xF6],
				mnem: 'PSADBW',
				instrExt: 'sse1',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xF7],
				mnem: 'MASKMOVQ',
				instrExt: 'sse1',
				operands: [{a: 'P', t: 'q'}, {a: 'N', t: 'q'}]
			},
			{
				seq: [0x0F, 0xF7],
				mnem: 'MASKMOVDQU',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'U', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xF8],
				mnem: 'PSUBB',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xF8],
				mnem: 'PSUBB',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xF9],
				mnem: 'PSUBW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xF9],
				mnem: 'PSUBW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xFA],
				mnem: 'PSUBD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xFA],
				mnem: 'PSUBD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xFB],
				mnem: 'PSUBQ',
				instrExt: 'sse2',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xFB],
				mnem: 'PSUBQ',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xFC],
				mnem: 'PADDB',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xFC],
				mnem: 'PADDB',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xFD],
				mnem: 'PADDW',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xFD],
				mnem: 'PADDW',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			},
			{
				seq: [0x0F, 0xFE],
				mnem: 'PADDD',
				instrExt: 'mmx',
				operands: [{a: 'P', t: 'q'}, {a: 'Q', t: 'q'}]
			},
			{
				seq: [0x0F, 0xFE],
				mnem: 'PADDD',
				instrExt: 'sse2',
				operands: [{a: 'V', t: 'dq'}, {a: 'W', t: 'dq'}]
			}
		]
	};
	
	DisASMx86.prototype.config = null;
	
	/**
	 * Formats a hex number according to the defined notation.
	 * 
	 * @param {number} num the number to format
	 * @return {string} the formatted string
	 */
	DisASMx86.prototype.formatHexNumber = function(num) {
		if (this.config.notation === 'INT') {
			var hexString = Math.abs(num).toString(16).toUpperCase();
			if (hexString[0].match(/[A-Z]/)) {
				hexString = '0' + hexString;
			}
			
			return (num < 0 ? '-' : '') + hexString + 'h';
		} else if (this.config.notation === 'AT&T') {
			return (num < 0 ? '-' : '') + '0x' + Math.abs(num);
		} else {
			throw new Error('Invalid notation!');
		}
	};
	
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
	 * Returns the appropriate register property name for the
	 * given register number and instruction set.
	 * 
	 * @param {number} size the operand/address size
	 * @param {string} instrExt the used intruction set
	 * @return {string} the property name
	 */
	DisASMx86.prototype.getRegisterMode = function(size, instrExt) {
		if (!instrExt) {
			return 'r' + size;
		} else if (instr_ext === 'mmx' && size === 64) {
			return 'mm';
		} else if (instrExt === 'sse' && size === 128) {
			return 'xmm';
		}
		
		throw 'Unknown register mode!';
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
	 * @return {Objects}
	 */
	DisASMx86.prototype.parseOperation = function(buf, offset, prefixes) {
		var operation = null;
		
		for (var i=0; i < DisASMx86.x86Opcodes.opcodes.length; ++i) {
			var op = DisASMx86.x86Opcodes.opcodes[i];
			if (operation !== null && op.seq.length < operation.seq.length) continue;
			
			var j = 0;
			for (; j < op.seq.length; ++j) {
				if (op.seq[j] !== buf[offset + j]) break;
			}
			if (j !== op.seq.length) {
				if (!op.operands || op.operands.length === 0) continue;
				
				var operand = op.operands[0];
				if (!operand.a || operand.a.indexOf('Z') === -1) continue;
				
				if (op.seq[j] !== (buf[offset + j] & 0xF8)) continue; // Check operands for register indicator
			}
			
			if ((op.opExt || op.opExt === 0) && op.opExt !== this.getReg(buf[offset + op.seq.length])) {
				continue;
			}
			
			operation = extend(op);
			
			//FIXME: What if not all prefixes exist?
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
		var displ = false;
		var adrOf = true;
		var sib = false;
		var regData = null;
		
		var mod = this.getMod(b);
		switch (mod) { // case 0 handled as default
			case 1:
				displ = 1;
				break;
			case 2:
				displ = 2;
				break;
			case 3:
				adrOf = false;
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
				regData = DisASMx86.Registers[reg];
				break;
			case 4:
				if (mod !== 3) {
					sib = true;
				} else {
					regData = DisASMx86.Registers[reg];
				}
				break;
			case 5:
				if (mod === 0) {
					displ = 2;
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
	 * Parses operand type E.
	 * 
	 * @private
	 * @param {Array.<number>|Uint8Array} buf the buffer to parse
	 * @param {number} offset the offset to parse from
	 * @param {Object} operation the operation to parse
	 * @param {string} opType the size of the operand
	 * @return {str: string, len: number}
	 */
	DisASMx86.prototype.parseTypeE = function(buf, sharedOffset, ownOffset, operation, opSize) {
		var modRM = this.parseModRM(buf[sharedOffset]);
		var len = 1;
		
		var str = '';
		if (modRM.src.sib)  {
			var sib = this.parseSIB(buf[sharedOffset + len]);

			if (sib.scale !== 0) {
				str = ' ' + DisASMx86.Registers[sib.index].r32 + ' * ' + (1 << sib.scale);
			}
			str += ' ' + DisASMx86.Registers[sib.base].r32 + ' ';
			
			len++;
		} else if (modRM.src.reg) {
			str = ' ' + modRM.src.reg[this.getRegisterMode(this.modeConfig.operSize, operation.instrExt)] + ' '; //FIXME: Register must be size dependent
		}
		
		if (modRM.src.displ === 1) {
			str += '+ ' + this.formatHexNumber(parseNumber(buf, sharedOffset + len, 1));
			++len;
		} else if (modRM.src.displ === 2) {
			str += '+ ' + this.formatHexNumber(parseNumber(buf, sharedOffset + len, this.modeConfig.operSize / 8));
			len += this.modeConfig.operSize / 8;
		}
		
		str = str.substring(1);
		if (modRM.src.adrOf) {
			str = '[' + str + ']';
		}
		
		return {str: str, sharedLen: len, ownLen: 0};
	};
	
	/**
	 * Parses operand type G.
	 * 
	 * @private
	 * @param {Array.<number>|Uint8Array} buf the buffer to parse
	 * @param {number} offset the offset to parse from
	 * @param {Object} operation the operation to parse
	 * @param {string} opType the size of the operand
	 * @return {str: string, len: number}
	 */
	DisASMx86.prototype.parseTypeG = function(buf, sharedOffset, ownOffset, operation, opSize) {
		var modRM = this.parseModRM(buf[sharedOffset]);
		var size;
		
		switch (opSize) {
			case 'v':
			case 'vqp':
			case 'vds':
				size = this.modeConfig.operSize === 32 ? 32 : 16;
				break;
			case 'b':
				size = 8;
				break;
			default:
				throw 'OpSize ' + opSize + ' unknown!';
		}
		
		return {str: modRM.dest[this.getRegisterMode(size, operation.instrExt)], sharedLen: 1, ownLen: 0};
	};
	
	/**
	 * Parses operand type I.
	 * 
	 * @private
	 * @param {Array.<number>|Uint8Array} buf the buffer to parse
	 * @param {number} offset the offset to parse from
	 * @param {Object} operation the operation to parse
	 * @param {string} opType the size of the operand
	 * @return {str: string, len: number}
	 */
	DisASMx86.prototype.parseTypeI = function(buf, sharedOffset, ownOffset, operation, opSize) {
		var size;
		
		switch (opSize) {
			case 'v':
			case 'vs':
			case 'vqp':
			case 'vds':
				size = this.modeConfig.operSize === 32 ? 32 : 16;
				break;
			case 'b':
			case 'bs':
			case 'bss':
				size = 8;
				break;
			default:
				throw 'OpSize ' + opSize + ' unknown!';
		}
		
		return {str: '+ ' + this.formatHexNumber(parseNumber(buf, ownOffset, size / 8)), ownLen: size / 8, sharedLen: 0};
	};
	
	/**
	 * Parses operand type J.
	 * 
	 * @private
	 * @param {Array.<number>|Uint8Array} buf the buffer to parse
	 * @param {number} offset the offset to parse from
	 * @param {Object} operation the operation to parse
	 * @param {string} opType the size of the operand
	 * @return {str: string, len: number}
	 */
	DisASMx86.prototype.parseTypeJ = function(buf, sharedOffset, ownOffset, operation, opSize) {
		var size;
		
		switch (opSize) {
			case 'v':
			case 'vqp':
			case 'vds':
				size = this.modeConfig.operSize === 32 ? 32 : 16;
				break;
			case 'bs':
				size = 8;
				break;
			default:
				throw 'OpSize ' + opSize + ' unknown!';
		}
		
		var num =  parseNumber(buf, ownOffset, size / 8) ;
		return {str: this.formatHexNumber(num), ownLen: size / 8, sharedLen: 0};
	};
	
	/**
	 * Parses operand type M.
	 * 
	 * @private
	 * @param {Array.<number>|Uint8Array} buf the buffer to parse
	 * @param {number} offset the offset to parse from
	 * @param {Object} operation the operation to parse
	 * @param {string} opType the size of the operand
	 * @return {str: string, len: number}
	 */
	DisASMx86.prototype.parseTypeM = function(buf, sharedOffset, ownOffset, operation, opSize) {
		var modRM = this.parseModRM(buf[sharedOffset]);
		var len = 1;
		
		var str = '';
		if (modRM.src.sib)  {
			if (modRM.src.sib.scale !== 0) {
				str = ' ' + DisASMx86.Registers[modRM.src.sib.index].r32 + ' * ' + (1 << modRm.src.sib.scale);
			}
			str += ' ' + DisASMx86.Registers[modRM.src.sib.base].r32 + ' ';
			
			len++;
		} else if (modRM.src.reg) {
			str = ' ' + modRM.src.reg[this.getRegisterMode(this.modeConfig.operSize, operation.instrExt)] + ' ';
		}
		
		if (modRM.src.displ === 1) {
			str += '+ ' + this.formatHexNumber(parseNumber(buf, sharedOffset + len, 1));
			++len;
		} else if (modRM.src.displ === 2) {
			str += this.formatHexNumber(parseNumber(buf, sharedOffset + len, this.modeConfig.operSize / 8));
			len += this.modeConfig.operSize / 8;
		}
		
		str = str.substring(1);
		if (modRM.src.adrOf) {
			str = '[' + str + ']';
		}
		
		return {str: str, ownLen: 0, sharedLen: len};
	};
	
	/**
	 * Parses operand type O.
	 * 
	 * @private
	 * @param {Array.<number>|Uint8Array} buf the buffer to parse
	 * @param {number} offset the offset to parse from
	 * @param {Object} operation the operation to parse
	 * @param {string} opType the size of the operand
	 * @return {str: string, len: number}
	 */
	DisASMx86.prototype.parseTypeO = function(buf, sharedOffset, ownOffset, operation, opSize) {
		var num = parseNumber(buf, ownOffset, this.modeConfig.addrSize / 8) ;
		return {str: this.formatHexNumber(num), ownLen: this.modeConfig.addrSize / 8, sharedLen: 0};
	};
	
	/**
	 * Parses operand type Z.
	 * 
	 * @private
	 * @param {Array.<number>|Uint8Array} buf the buffer to parse
	 * @param {number} offset the offset to parse from
	 * @param {Object} operation the operation to parse
	 * @param {string} opType the size of the operand
	 * @return {str: string, len: number}
	 */
	DisASMx86.prototype.parseTypeZ = function(buf, sharedOffset, ownOffset, operation, opSize) {
		var reg = buf[sharedOffset - operation.seq.length] & 7;
		
		var size;
		switch (opSize) {
			case 'v':
			case 'vqp':
				size = this.modeConfig.operSize === 32 ? 32 : 16;
				break;
			case 'b':
				size = 8;
			default:
				throw 'OpSize ' + opSize + ' unknown!';
		}
		return {str: DisASMx86.Registers[reg][this.getRegisterMode(size, operation.instrExt)], ownLen: 0, sharedLen: 0};
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
		this.modeConfig = {addrSize: 32, operSize: 32};
		var preOffset = offset;
		
		var prefixes = this.parsePrefixes(buf, offset);
		offset += prefixes.length;
		
		var operation = this.parseOperation(buf, offset, prefixes);
		offset += operation.seq.length;
		
		var operands = new Array(operation.operands ? operation.operands.length : 0);
		
		var ownOffset = offset;
		var sharedLen = 0;
		var info;
		for (var i=0; i < operands.length; ++i) {
			if (operation.operands[i].a) {
				info = this['parseType' + operation.operands[i].a](buf, offset, ownOffset + sharedLen, operation, operation.operands[i].t);
				operands[i] = info.str;
				sharedLen = sharedLen > info.sharedLen ? sharedLen : info.sharedLen;
				ownOffset += info.ownLen;
			} else if (operation.operands[i].r) {
				switch (operation.operands[i].t) {
					case 'vqp':
						operands[i] = operation.operands[i].r[this.getRegisterMode(this.modeConfig.operSize, operation.instrExt)];
						break;
					case 'w':
						operands[i] = operation.operands[i].r[this.getRegisterMode(16, operation.instrExt)];
						break;
					default:
						throw 'Unknown register type ' + operation.operands[i].t + '!';
				}
			} else {
				throw 'Unknown Operand!';
			}
		}
		offset = sharedLen + ownOffset;
		
		
		/*
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
		}*/
		
		return {
			prefixes: prefixes,
			operation: operation,
			operands: operands,
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
			
			str += ' ' + data.operation.mnem;
			
			var operandString = '';
			for (var i=0; i < data.operands.length; ++i) {
				if (typeof data.operands[i] === 'string') {
					operandString += ', ' + data.operands[i];
				} else if (typeof data.operands[i] === 'number') {
					operandString += ', 0x' + data.operands[i].toString(16) + 'h';
				}
			}
			
			str += operandString.length > 0 ? operandString.substring(1) : '';
		}
		
		return {str: str.length > 0 ? str.substr(1) : '', length: data.length};
	};
	
	self.DisASMx86 = DisASMx86;
})();