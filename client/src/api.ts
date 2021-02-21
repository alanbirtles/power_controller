import { Readings } from './types';
import querystring from 'querystring';

class API {
  urlRoot: string;

  constructor(url: string) {
    this.urlRoot = (url.endsWith("/") ? url : url + "/") + "api/v1/";
  }

  getUsage(from: Date, to: Date, controller?: number): Promise<Readings> {
    return this.get("power/usage", { from: from.getTime() / 1000, to: to.getTime() / 1000, controller });
  }

  get(url: string, query?: querystring.ParsedUrlQueryInput): Promise<any> {
    return this.doFetch(url, "GET", null, query, 200);
  }

  post(url: string, body: Record<string, any>, expectedCode?: number) {
    return this.doFetch(url, "POST", body, undefined, expectedCode);
  }

  async doFetch(url: string, method: string, body: Record<string, any> | null, query?: querystring.ParsedUrlQueryInput, expectedCode?: number): Promise<any> {
    const init: RequestInit = {
      method,
    };
    if (body) {
      init.body = JSON.stringify(body);
      init.headers = new Headers();
      init.headers.append("Content-Type", "application/json");
    }
    url = this.urlRoot + url;
    if (query) {
      url += "?" + querystring.encode(query);
    }
    const response = await fetch(url, init);
    if (expectedCode && response.status != expectedCode) {
      throw Error("Unexpected return code: " + response.status);
    }
    return response.json();
  }

}
if (!process.env["VUE_APP_API_ROOT"]) {
  throw Error("VUE_APP_API_ROOT environment variable not defined")
}
export default new API(process.env["VUE_APP_API_ROOT"]);