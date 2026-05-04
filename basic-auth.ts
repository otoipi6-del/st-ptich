import type { Context } from "@netlify/edge-functions";

const credentials = {
  Username: Netlify.env.get("BASIC_USERNAME"),
  Password: Netlify.env.get("BASIC_PASSWORD"),
};

const correctAuthString = () => {
  const { Username, Password } = credentials;
  const base64Credentials = btoa(`${Username}:${Password}`);
  return `Basic ${base64Credentials}`;
};

export default async (request: Request, context: Context) => {
  const response = await context.next();

  const authHeader = request.headers.get("Authorization");

  if (credentials.Password && (!authHeader || authHeader !== correctAuthString())) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": "Basic realm="ST PTICH"",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return response;
};
