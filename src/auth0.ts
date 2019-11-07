import * as Hapi from "@hapi/hapi";
import * as Boom from "@hapi/boom";
import { AuthenticationClient } from "auth0";
import fetch from "node-fetch";
import { URLSearchParams } from "url";

// https://auth0.com/docs/api/authentication#get-token
// https://auth0.github.io/node-auth0/
type Auth0JSONToken = {
  access_token: string;
  id_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
};

export async function getAuth0Token(
  code: string,
): Promise<Auth0JSONToken> {
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("client_id", process.env.AUTH0_CLIENT_ID);
  params.append("client_secret", process.env.AUTH0_CLIENT_SECRET);
  params.append("redirect_uri", process.env.AUTH0_REDIRECT_URI);
  params.append("code", code);

  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: "post",
    body: params
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const json = await response.json();
  return json;
}

export async function getAuth0UserInfo(
  accessToken: string,
) {
  const auth0 = new AuthenticationClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
  });
  // https://auth0.com/docs/api/authentication#get-user-info
  return auth0.users.getInfo(accessToken);
}

type Options = {
  appURL: string;
  callbackPath: string;
  clientID: string;
  clientSecret: string;
  credentialsName: string;
  domain: string;
  scope?: string;
  success?: (userInfo) => Promise<void>;
  error?: (Error) => void;
};

function Auth0Scheme(
  server: Hapi.Server,
  enteredOptions: Options
): Hapi.IServerAuthScheme {
  const options = {
    ...enteredOptions,
    scope: "profile openid email"
  };

  server.route({
    method: "get",
    path: options.callbackPath,
    options: {
      auth: false
    },
    async handler(req, h): Promise<Hapi.ResponseToolkit> {
      const queryStringParams = req.query;
      if (queryStringParams.error && queryStringParams.error_description) {
        const err = new Error(
          `${queryStringParams.error}: ${queryStringParams.error_description}`
        );
        return;
      }

      const { code } = queryStringParams;
      const auth0token = await getAuth0Token(code);
      const userInfo = await getAuth0UserInfo(auth0token.access_token);

      req.yar.set(options.credentialsName, userInfo);
      return h.redirect(
        /* options.loginSuccessRedirectPath || req.yar.get('destination') || */ "/"
      );
    }
  });

  return {
    async authenticate(req, h): Promise<void> {
      try {
        if (!req.yar.get("destination")) {
          req.yar.set("destination", req.path);
        }
        const credentials = req.yar.get(options.credentialsName);
        if (credentials) {
          let artifacts = null;
          if (options.success && typeof options.success === "function") {
            artifacts = await options.success(credentials);
          }

          return h.authenticated({
            credentials,
            artifacts
          });
        }
        const response = h.response();
        const redirectURI = `${options.appURL}${options.callbackPath}`;
        response.redirect(
          `https://${options.domain}/login?response_type=code&scope=${
            options.scope
          }&client=${options.clientID}&redirect_uri=${redirectURI}`
        );
        return response.takeover();
      } catch (err) {
        console.error(err);
        return h.unauthenticated(Boom.unauthorized(err.message));
      }
    }
  };
}

export const auth0 = {
  name: "auth0",
  register: async (server: Hapi.Server): Promise<void> => {
    server.auth.scheme("auth0", Auth0Scheme);
  }
};