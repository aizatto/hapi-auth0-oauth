"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Boom = require("@hapi/boom");
var auth0_1 = require("auth0");
var node_fetch_1 = require("node-fetch");
var url_1 = require("url");
function getAuth0Token(code) {
    return __awaiter(this, void 0, void 0, function () {
        var params, response, json;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = new url_1.URLSearchParams();
                    params.append("grant_type", "authorization_code");
                    params.append("client_id", process.env.AUTH0_CLIENT_ID);
                    params.append("client_secret", process.env.AUTH0_CLIENT_SECRET);
                    params.append("redirect_uri", process.env.AUTH0_REDIRECT_URI);
                    params.append("code", code);
                    return [4 /*yield*/, node_fetch_1.default("https://" + process.env.AUTH0_DOMAIN + "/oauth/token", {
                            method: "post",
                            body: params
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    json = _a.sent();
                    return [2 /*return*/, json];
            }
        });
    });
}
exports.getAuth0Token = getAuth0Token;
function getAuth0UserInfo(accessToken) {
    return __awaiter(this, void 0, void 0, function () {
        var auth0;
        return __generator(this, function (_a) {
            auth0 = new auth0_1.AuthenticationClient({
                domain: process.env.AUTH0_DOMAIN,
                clientId: process.env.AUTH0_CLIENT_ID,
            });
            // https://auth0.com/docs/api/authentication#get-user-info
            return [2 /*return*/, auth0.users.getInfo(accessToken)];
        });
    });
}
exports.getAuth0UserInfo = getAuth0UserInfo;
function Auth0Scheme(server, enteredOptions) {
    var options = __assign(__assign({}, enteredOptions), { scope: "profile openid email" });
    server.route({
        method: "get",
        path: options.callbackPath,
        options: {
            auth: false
        },
        handler: function (req, h) {
            return __awaiter(this, void 0, void 0, function () {
                var queryStringParams, err, code, auth0token, userInfo;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            queryStringParams = req.query;
                            if (queryStringParams.error && queryStringParams.error_description) {
                                err = new Error(queryStringParams.error + ": " + queryStringParams.error_description);
                                return [2 /*return*/];
                            }
                            code = queryStringParams.code;
                            return [4 /*yield*/, getAuth0Token(code)];
                        case 1:
                            auth0token = _a.sent();
                            return [4 /*yield*/, getAuth0UserInfo(auth0token.access_token)];
                        case 2:
                            userInfo = _a.sent();
                            req.yar.set(options.credentialsName, userInfo);
                            return [2 /*return*/, h.redirect(
                                /* options.loginSuccessRedirectPath || req.yar.get('destination') || */ "/")];
                    }
                });
            });
        }
    });
    return {
        authenticate: function (req, h) {
            return __awaiter(this, void 0, void 0, function () {
                var credentials, artifacts, response, redirectURI, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            if (!req.yar.get("destination")) {
                                req.yar.set("destination", req.path);
                            }
                            credentials = req.yar.get(options.credentialsName);
                            if (!credentials) return [3 /*break*/, 3];
                            artifacts = null;
                            if (!(options.success && typeof options.success === "function")) return [3 /*break*/, 2];
                            return [4 /*yield*/, options.success(credentials)];
                        case 1:
                            artifacts = _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, h.authenticated({
                                credentials: credentials,
                                artifacts: artifacts
                            })];
                        case 3:
                            response = h.response();
                            redirectURI = "" + options.appURL + options.callbackPath;
                            response.redirect("https://" + options.domain + "/login?response_type=code&scope=" + options.scope + "&client=" + options.clientID + "&redirect_uri=" + redirectURI);
                            return [2 /*return*/, response.takeover()];
                        case 4:
                            err_1 = _a.sent();
                            console.error(err_1);
                            return [2 /*return*/, h.unauthenticated(Boom.unauthorized(err_1.message))];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
    };
}
exports.auth0 = {
    name: "auth0",
    register: function (server) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            server.auth.scheme("auth0", Auth0Scheme);
            return [2 /*return*/];
        });
    }); }
};
//# sourceMappingURL=auth0.js.map