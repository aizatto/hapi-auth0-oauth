declare type Auth0JSONToken = {
    access_token: string;
    id_token: string;
    scope: string;
    expires_in: number;
    token_type: string;
};
export declare function getAuth0Token(code: string): Promise<Auth0JSONToken>;
export declare function getAuth0UserInfo(accessToken: string): Promise<any>;
export declare const auth0: {
    name: string;
    register: (server: any) => Promise<void>;
};
export {};
//# sourceMappingURL=auth0.d.ts.map