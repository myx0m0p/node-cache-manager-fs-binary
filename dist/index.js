"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DiskStore_instances, _DiskStore_currentsize, _DiskStore_collection, _DiskStore_initializationPromise, _DiskStore_ensureDirectoryExists, _DiskStore_serialize, _DiskStore_deserialize;
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReadableStream = exports.isStream = exports.create = exports.DiskStore = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const stream_1 = require("stream");
const promises_2 = require("stream/promises");
const util_1 = require("util");
const uuid = __importStar(require("uuid"));
const v8_1 = require("v8");
const zlib_1 = require("zlib");
const metadata_1 = require("./metadata");
const utils_1 = require("./utils");
const unzipPromise = (0, util_1.promisify)(zlib_1.unzip);
const deflatePromise = (0, util_1.promisify)(zlib_1.deflate);
const DEFAULT_TTL = 60000;
class DiskStore {
    /**
     * construction of the disk storage
     */
    constructor(options = {}) {
        _DiskStore_instances.add(this);
        this.name = 'diskstore';
        // current size of the cache
        _DiskStore_currentsize.set(this, 0);
        // internal array for informations about the cached files - resists in memory
        _DiskStore_collection.set(this, new Map());
        // Promise for the initialization of the cache
        _DiskStore_initializationPromise.set(this, void 0);
        // options for the cache
        this.options = {
            path: 'cache',
            ttl: DEFAULT_TTL,
            maxsize: 0,
            zip: false,
            preventfill: false,
            binaryEncode: false,
        };
        Object.assign(this.options, options);
        // fill the cache on startup with already existing files
        if (!options.preventfill) {
            __classPrivateFieldSet(this, _DiskStore_initializationPromise, this.intializefill(), "f");
        }
    }
    get currentsize() {
        return __classPrivateFieldGet(this, _DiskStore_currentsize, "f");
    }
    get initializationPromise() {
        return __classPrivateFieldGet(this, _DiskStore_initializationPromise, "f");
    }
    mset(args, ttl) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(args.map(([key, value]) => this.set(key, value, ttl)));
        });
    }
    mget(...args) {
        return Promise.all(args.map((key) => this.get(key)));
    }
    mdel(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const key of args) {
                yield this.del(key);
            }
        });
    }
    ttl(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const metaData = __classPrivateFieldGet(this, _DiskStore_collection, "f").get(key);
            if (!metaData) {
                return -1;
            }
            return metaData.expires;
        });
    }
    /**
     * delete an entry from the cache
     */
    del(key) {
        return __awaiter(this, void 0, void 0, function* () {
            // get the metainformations for the key
            const metadata = __classPrivateFieldGet(this, _DiskStore_collection, "f").get(key);
            if (!metadata) {
                return;
            }
            try {
                yield (0, utils_1.unlinkIfExist)(metadata.binaryFilename);
                yield (0, utils_1.unlinkIfExist)(metadata.filename);
                // update internal properties
                __classPrivateFieldSet(this, _DiskStore_currentsize, __classPrivateFieldGet(this, _DiskStore_currentsize, "f") - metadata.size, "f");
                __classPrivateFieldGet(this, _DiskStore_collection, "f").delete(key);
            }
            catch (e) {
                // ignore errors
            }
        });
    }
    set(key, val, ttl) {
        var _a;
        if (ttl === void 0) { ttl = (_a = this.options.ttl) !== null && _a !== void 0 ? _a : DEFAULT_TTL; }
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _DiskStore_instances, "m", _DiskStore_ensureDirectoryExists).call(this);
            const metadata = new metadata_1.MetaData({
                key,
                expires: Date.now() + ttl,
                filename: this.options.path + `/cache_${uuid.v4()}.dat`,
                size: 0,
            });
            let binarySize = 0;
            if (val instanceof Buffer || isReadableStream(val)) {
                // If the value is buffer or readable, we store it in a separate file
                const stream = isReadableStream(val) ? val : stream_1.Readable.from(val);
                // put storage filenames into stored value.binary object
                metadata.binaryFilename = (0, metadata_1.calculateBinaryFilename)(metadata.filename);
                yield (0, promises_2.pipeline)([
                    stream,
                    ...(this.options.zip ? [(0, zlib_1.createDeflate)()] : []),
                    (0, fs_1.createWriteStream)(metadata.binaryFilename),
                ]);
                // calculate the size of the binary data
                binarySize += (yield (0, promises_1.stat)(metadata.binaryFilename)).size;
            }
            else {
                metadata.value = val;
            }
            metadata.size = binarySize;
            const stream = yield __classPrivateFieldGet(this, _DiskStore_instances, "m", _DiskStore_serialize).call(this, metadata);
            metadata.size = stream.length + binarySize;
            if (this.options.maxsize && metadata.size > this.options.maxsize) {
                yield (0, utils_1.unlinkIfExist)(metadata.binaryFilename);
                throw new Error('Item size too big.');
            }
            // remove the key from the cache (if it already existed, this updates also the current size of the store)
            yield this.del(key);
            // check used space and remove entries if we use too much space
            yield this.freeupspace();
            // write data into the cache-file
            yield (0, promises_1.writeFile)(metadata.filename, stream);
            // remove data value from memory
            metadata.value = undefined;
            delete metadata.value;
            __classPrivateFieldSet(this, _DiskStore_currentsize, __classPrivateFieldGet(this, _DiskStore_currentsize, "f") + metadata.size, "f");
            // place element with metainfos in internal collection
            __classPrivateFieldGet(this, _DiskStore_collection, "f").set(metadata.key, metadata);
        });
    }
    get(key, readable = false) {
        return __awaiter(this, void 0, void 0, function* () {
            // get the metadata from the collection
            const data = __classPrivateFieldGet(this, _DiskStore_collection, "f").get(key);
            if (!data) {
                // not found
                return;
            }
            // found but expired
            if (data.expires < new Date().getTime()) {
                // delete the elemente from the store
                yield this.del(key);
                return;
            }
            // try to read the file
            const fileContent = yield (0, promises_1.readFile)(data.filename);
            const diskdata = yield __classPrivateFieldGet(this, _DiskStore_instances, "m", _DiskStore_deserialize).call(this, fileContent);
            if (diskdata === null || diskdata === void 0 ? void 0 : diskdata.binaryFilename) {
                const readableValue = (0, fs_1.createReadStream)(diskdata.binaryFilename);
                const dataStream = this.options.zip
                    ? readableValue.pipe((0, zlib_1.createInflate)())
                    : readableValue;
                if (readableValue !== dataStream) {
                    readableValue.on('error', (err) => {
                        dataStream.emit('error', err);
                    });
                }
                if (readable) {
                    return dataStream;
                }
                return (0, utils_1.streamToPromise)(dataStream);
            }
            return diskdata.value;
        });
    }
    getMetadata(key) {
        return __classPrivateFieldGet(this, _DiskStore_collection, "f").get(key);
    }
    /**
     * helper method to free up space in the cache (regarding the given spacelimit)
     */
    freeupspace() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options.maxsize) {
                return;
            }
            // do we use to much space? then cleanup first the expired elements
            if (__classPrivateFieldGet(this, _DiskStore_currentsize, "f") > this.options.maxsize) {
                this.cleanExpired();
            }
            // for this we need a sorted list basend on the expire date of the entries (descending)
            const tuples = Array.from(__classPrivateFieldGet(this, _DiskStore_collection, "f").entries())
                .sort(([, { expires: a }], [, { expires: b }]) => a - b)
                .map(([key]) => key);
            for (const key of tuples) {
                if (__classPrivateFieldGet(this, _DiskStore_currentsize, "f") <= this.options.maxsize) {
                    break;
                }
                // delete an entry from the store
                yield this.del(key);
            }
        });
    }
    /**
     * get keys stored in cache
     * @param {Function} cb
     */
    keys() {
        return __awaiter(this, void 0, void 0, function* () {
            return Array.from(__classPrivateFieldGet(this, _DiskStore_collection, "f").keys());
        });
    }
    /**
     * cleanup cache on disk -> delete all used files from the cache
     */
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const elementKey of __classPrivateFieldGet(this, _DiskStore_collection, "f").keys()) {
                yield this.del(elementKey);
            }
        });
    }
    /**
     * helper method to clean all expired files
     */
    cleanExpired() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [key, entry] of __classPrivateFieldGet(this, _DiskStore_collection, "f").entries()) {
                if (entry.expires < new Date().getTime()) {
                    yield this.del(key);
                }
            }
        });
    }
    /**
     * clean the complete cache and all(!) files in the cache directory
     */
    cleancache() {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _DiskStore_instances, "m", _DiskStore_ensureDirectoryExists).call(this);
            // clean all current used files
            yield this.reset();
            // check, if other files still resist in the cache and clean them, too
            const files = yield (0, promises_1.readdir)(this.options.path);
            for (const file of files) {
                const filename = (0, path_1.join)(this.options.path, file);
                yield (0, utils_1.unlinkIfExist)(filename);
            }
        });
    }
    /**
     * fill the cache from the cache directory (usefull e.g. on server/service restart)
     */
    intializefill() {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _DiskStore_instances, "m", _DiskStore_ensureDirectoryExists).call(this);
            // get potential files from disk
            const files = yield (0, promises_1.readdir)(this.options.path);
            for (const file of files) {
                if (!/\.dat$/.test(file)) {
                    // only .dat files, no .bin files read
                    continue;
                }
                const filename = (0, path_1.join)(this.options.path, file);
                if (!(yield (0, utils_1.exists)(filename))) {
                    continue;
                }
                try {
                    const data = yield (0, promises_1.readFile)(filename);
                    const diskdata = yield __classPrivateFieldGet(this, _DiskStore_instances, "m", _DiskStore_deserialize).call(this, data);
                    diskdata.filename = filename;
                    diskdata.size = diskdata.size + data.length;
                    // update collection size
                    __classPrivateFieldSet(this, _DiskStore_currentsize, __classPrivateFieldGet(this, _DiskStore_currentsize, "f") + diskdata.size, "f");
                    // remove the entrys content - we don't want the content in the memory (only the meta informations)
                    diskdata.value = undefined;
                    delete diskdata.value;
                    // and put the entry in the store
                    __classPrivateFieldGet(this, _DiskStore_collection, "f").set(diskdata.key, diskdata);
                    // check for expiry - in this case we instantly delete the entry
                    if (diskdata.expires < new Date().getTime()) {
                        yield this.del(diskdata.key);
                    }
                }
                catch (err) {
                    yield (0, utils_1.unlinkIfExist)(filename);
                    yield (0, utils_1.unlinkIfExist)((0, metadata_1.calculateBinaryFilename)(filename));
                }
            }
        });
    }
}
exports.DiskStore = DiskStore;
_DiskStore_currentsize = new WeakMap(), _DiskStore_collection = new WeakMap(), _DiskStore_initializationPromise = new WeakMap(), _DiskStore_instances = new WeakSet(), _DiskStore_ensureDirectoryExists = function _DiskStore_ensureDirectoryExists() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield (0, utils_1.exists)(this.options.path))) {
            try {
                yield (0, promises_1.mkdir)(this.options.path);
            }
            catch (err) {
                // Ignore the error if the directory already exists
            }
        }
    });
}, _DiskStore_serialize = function _DiskStore_serialize(value) {
    return __awaiter(this, void 0, void 0, function* () {
        const serialized = this.options.binaryEncode
            ? (0, v8_1.serialize)(value)
            : Buffer.from(JSON.stringify(value));
        if (this.options.zip) {
            return yield deflatePromise(serialized);
        }
        return serialized;
    });
}, _DiskStore_deserialize = function _DiskStore_deserialize(value) {
    return __awaiter(this, void 0, void 0, function* () {
        const serialized = this.options.zip ? yield unzipPromise(value) : value;
        const deserialized = this.options.binaryEncode
            ? (0, v8_1.deserialize)(serialized)
            : new metadata_1.MetaData(JSON.parse(serialized.toString()));
        return deserialized;
    });
};
/**
 * Export 'DiskStore'
 */
function create(args = {}) {
    return new DiskStore(args);
}
exports.create = create;
function isStream(stream) {
    return (stream !== null &&
        typeof stream === 'object' &&
        typeof stream.pipe === 'function');
}
exports.isStream = isStream;
function isReadableStream(stream) {
    return (isStream(stream) &&
        stream.readable !== false &&
        typeof stream._read === 'function' &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof stream._readableState === 'object');
}
exports.isReadableStream = isReadableStream;
//# sourceMappingURL=index.js.map