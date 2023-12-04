/// <reference types="node" />
/// <reference types="node" />
import { Readable } from 'stream';
export declare function exists(path: string): Promise<boolean>;
export declare function unlinkIfExist(path: string | undefined): Promise<void>;
export declare function streamToPromise(readable: Readable): Promise<Buffer>;
