"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBinaryFilename = exports.MetaData = void 0;
/**
 * helper object with meta-informations about the cached data
 */
class MetaData {
    constructor(o) {
        this.key = o.key;
        this.filename = o.filename;
        this.expires = o.expires;
        this.value = o.value;
        this.binaryFilename = o.binaryFilename;
        this.size = o.size;
    }
}
exports.MetaData = MetaData;
function calculateBinaryFilename(key) {
    return key.replace(/\.dat$/, `.bin`);
}
exports.calculateBinaryFilename = calculateBinaryFilename;
//# sourceMappingURL=metadata.js.map