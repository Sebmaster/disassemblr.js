var Uint64 = (function() {
    const MAX_UINT = Math.pow(2,32) - 1;
    // Check host endianness.
    var littleEndian = (function() {
        var b = new Uint8Array([0xff, 0x00]);
        var ec = new Uint16Array(b.buffer);
        return ec[0] == 0xff;
    })();

    function defAccessor(obj, name, storage, i) {
        Object.defineProperty(obj, name, {
                get: function() { return storage[i]; },
                set: function(x) {
                    if (x < 0) throw new Error("negative component");
                    if (x > MAX_UINT)
                        throw new Error("component too large");
                    storage[i] = x;
                },
                enumerable: true, configurable: false
        });
    }
    // Constructor, takes low and high words. Both default to zero if unset.
    function Uint64(lo, hi) {
        var buffer = new ArrayBuffer(8);
        Object.defineProperties(this, {
            // non-public properties for storage
            _bytes: {
                value: new Uint8Array(buffer),
                enumerable: false, writable: false, configurable: false
            },
            _ints: {
                value: new Uint32Array(buffer),
                enumerable: false, writable: false, configurable: false
            }
        });
        defAccessor(this, 'lo', this._ints, littleEndian ? 0 : 1);
        defAccessor(this, 'hi', this._ints, littleEndian ? 1 : 0);
        this.lo = lo ? lo : 0;
        this.hi = hi ? hi : 0;
    }

    // Alternate constructor, construct from an array of bytes.
    // If |bigEndian| is not specified or false, default to
    // little-endian byte order.
    Uint64.fromBytes = function(b, bigEndian) {
        if (b.length > 8)
            throw new Error("too many bytes!");
        var u = new Uint64();
        var lobytes, hibytes;
        if (!!bigEndian == littleEndian) {
            // endian mismatch
            var start;
            if (littleEndian) {
                start = b.length - 1;
            }
            else {
                start = u._bytes.length - 1;
            }
            for (var i = start, j = 0;
                 i < u._bytes.length && i >= 0 && j < b.length; i--, j++) {
                u._bytes[i] = b[j];
            }
        }
        else {
            // same endian, just copy
            u._bytes.set(b);
        }
        return u;
    }

    Uint64.prototype = {
        // toString returns a hex string because it's simpler.
        toString: function() {
            var l = [];
            for (var i=0; i<this._bytes.length; i++) {
                var b = this._bytes[i].toString(16);
                l.unshift(b.length == 2 ? b : "0" + b);
            }
            if (!littleEndian)
                l = l.reverse();
            return "0x" + l.join("");
        },
        // Add x to this, modifying this.
        add: function(x) {
            var a = this.lo + x.lo;
            var b = this.hi + x.hi;
            if (a > MAX_UINT) {
                b++;
                a -= (MAX_UINT + 1);
            }
            this.lo = a;
            this.hi = b;
        },

        // Add x to this, return the result. Does not modify this.
        plus: function(x) {
            var a = new Uint64(this.lo, this.hi);
            a.add(x);
            return a;
        },

        // Subtract x from this, modifying this.
        sub: function(x) {
            var a = this.lo - x.lo;
            var b = this.hi - x.hi;
            if (a < 0) {
                b--;
                a += (MAX_UINT + 1);
            }
            this.lo = a;
            this.hi = b;
        },

        // Subtract x from this, return the result. Does not modify this.
        minus: function(x) {
            var a = new Uint64(this.lo, this.hi);
            a.sub(x);
            return a;
        },

        // Return 0 if this == x, -1 if this < x, 1 if this > x.
        cmp: function(x) {
            if (this.hi == x.hi) {
                if (this.lo == x.lo)
                    return 0;

                if (this.lo < x.lo)
                    return -1;

                return 1;
            }

            if (this.hi < x.hi)
                return -1;

            return 1;
        },

        // ==
        eq: function(x) {
            return this.cmp(x) == 0;
        },

        // !=
        ne: function(x) {
            return this.cmp(x) != 0;
        },

        // <
        lt: function(x) {
            return this.cmp(x) == -1;
        },

        // >
        gt: function(x) {
            return this.cmp(x) == 1;
        },

        // <=
        lte: function(x) {
            var c = this.cmp(x);
            return c == -1 || c == 0;
        },

        // >=
        gte: function(x) {
            var c = this.cmp(x);
            return c == 1 || c == 0;
        },
    }

    return Uint64;
})();