/// <reference types="node" />
/// <reference types="node" />
import type { Cache, Milliseconds, Store } from 'cache-manager';
import { Stream, Readable as ReadableStream, Readable } from 'stream';
import { MetaData } from './metadata';
export interface DiskStoreOptions {
    path: string;
    ttl: Milliseconds;
    maxsize: number;
    zip: boolean;
    preventfill: boolean;
    binaryEncode: boolean;
}
export declare class DiskStore implements Store {
    #private;
    name: string;
    readonly options: DiskStoreOptions;
    /**
     * construction of the disk storage
     */
    constructor(options?: Partial<DiskStoreOptions>);
    get currentsize(): number;
    get initializationPromise(): Promise<void> | undefined;
    mset(args: [string, unknown][], ttl?: Milliseconds): Promise<void>;
    mget(...args: string[]): Promise<unknown[]>;
    mdel(...args: string[]): Promise<void>;
    ttl(key: string): Promise<number>;
    /**
     * delete an entry from the cache
     */
    del(key: string): Promise<void>;
    /**
     * set a key into the cache
     */
    set(key: string, val: Buffer, ttl?: Milliseconds): Promise<void>;
    set(key: string, val: Readable, ttl?: Milliseconds): Promise<void>;
    set<T>(key: string, val: T, ttl?: Milliseconds): Promise<void>;
    /**
     * get entry from the cache
     */
    get(key: string, readable: true): Promise<Readable | undefined>;
    get<T>(key: string): Promise<T | undefined>;
    getMetadata(key: string): MetaData<unknown> | undefined;
    /**
     * helper method to free up space in the cache (regarding the given spacelimit)
     */
    freeupspace(): Promise<void>;
    /**
     * get keys stored in cache
     * @param {Function} cb
     */
    keys(): Promise<string[]>;
    /**
     * cleanup cache on disk -> delete all used files from the cache
     */
    reset(): Promise<void>;
    /**
     * helper method to clean all expired files
     */
    cleanExpired(): Promise<void>;
    /**
     * clean the complete cache and all(!) files in the cache directory
     */
    cleancache(): Promise<void>;
    /**
     * fill the cache from the cache directory (usefull e.g. on server/service restart)
     */
    intializefill(): Promise<void>;
}
export type DiskStoreCache = Cache<DiskStore>;
/**
 * Export 'DiskStore'
 */
export declare function create(args?: Partial<DiskStoreOptions>): DiskStore;
export declare function isStream(stream: unknown): stream is Stream;
export declare function isReadableStream(stream: unknown): stream is ReadableStream;
