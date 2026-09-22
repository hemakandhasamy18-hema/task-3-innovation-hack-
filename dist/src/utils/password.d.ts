export declare const hashPassword: (plaintext: string) => Promise<string>;
export declare const comparePassword: (plaintext: string, hash: string) => Promise<boolean>;
