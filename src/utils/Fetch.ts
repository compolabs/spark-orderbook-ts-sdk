import { Nilable } from "tsdef";

export class Fetch {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  private request = async <T>(
    endpoint: string,
    data: RequestInit,
  ): Promise<T> => {
    return fetch(endpoint, data)
      .then((response) => response.json())
      .then((data: T) => {
        return data;
      });
  };

  protected post = <T>(
    body: Record<string, any>,
    credentials: RequestCredentials = "same-origin",
    headers: Record<string, string>,
  ) => {
    return this.request<T>(this.url, {
      method: "POST",
      body: JSON.stringify(body),
      credentials,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  };

  protected get = <T>(
    endpoint: string,
    params: Record<string, Nilable<string | number>> = {},
  ) => {
    const validParams = Object.entries(params).filter(([, value]) =>
      Boolean(value),
    ) as [string, string][];
    const searchParams = new URLSearchParams(validParams);

    return this.request<T>(`${endpoint}?${searchParams.toString()}`, {
      method: "GET",
    });
  };
}
