import axios from "axios";

export class AxiosService {
  public async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await axios.get<T>(url, { params });
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        `Error making GET request to ${url}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  static async post<T>(url: string, data: T, headers?: Record<string, string>) {
    try {
      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        `Error making POST request to ${url}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export default new AxiosService();
