/**
 * helper object with meta-informations about the cached data
 */
export declare class MetaData<T> {
    key: string;
    filename: string;
    expires: number;
    value?: T;
    binaryFilename?: string;
    size: number;
    constructor(o: MetaData<T>);
}
export declare function calculateBinaryFilename(key: string): string;
