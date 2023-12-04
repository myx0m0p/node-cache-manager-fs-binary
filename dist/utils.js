"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamToPromise = exports.unlinkIfExist = exports.exists = void 0;
const promises_1 = require("fs/promises");
function exists(path) {
    return (0, promises_1.access)(path)
        .then(() => true)
        .catch(() => false);
}
exports.exists = exists;
function unlinkIfExist(path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (path) {
                yield (0, promises_1.unlink)(path);
            }
        }
        catch (err) {
            // ignore
        }
    });
}
exports.unlinkIfExist = unlinkIfExist;
function streamToPromise(readable) {
    return new Promise((resolve, reject) => {
        const _buf = [];
        readable.on('data', (chunk) => _buf.push(chunk));
        readable.on('end', () => resolve(Buffer.concat(_buf)));
        readable.on('error', (err) => reject(`error converting stream - ${err}`));
    });
}
exports.streamToPromise = streamToPromise;
//# sourceMappingURL=utils.js.map