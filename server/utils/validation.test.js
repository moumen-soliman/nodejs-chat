const expect = require('expect');

// import isRealString
const {isRealString} = require('./validation');

describe('isRealString', () => {

   // should reject non-string values	
	it('should reject non-string values', () => {
		var res = isRealString(98);
		expect(res).toBe(false);
	});
   // should reject string with only spaces
	it ('should reject non-string values', () => {
		var res = isRealString('    ');
		expect(res).toBe(false);
	});
   // should allow string with non-space charecters
	it('should allow string with non-space charecters', () => {
		var res = isRealString('  Moumen  ');
		expect(res).toBe(true);
	})
});