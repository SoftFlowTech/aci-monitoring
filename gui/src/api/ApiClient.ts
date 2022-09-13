import { Metric } from '../types';

export class ApiClient {
  private url: string;

  public constructor(url: string) {
    this.url = url.replace(/\/+$/, '');
  }

  public getMetrics(): Promise<Metric[]> {
    return fetch(`${this.url}/metrics`)
      .then((response) => response.json())
      .then((data) => (data?.error ? Promise.reject(new Error(data.error)) : data));
  }

  public deleteMetric(name: string): Promise<Metric[]> {
    return fetch(`${this.url}/metrics/${encodeURIComponent(name)}`, { method: 'DELETE' })
      .then((response) => response.json())
      .then((data) => (data?.error ? Promise.reject(new Error(data.error)) : data));
  }

  public addMetric(metric: Metric): Promise<Metric[]> {
    return fetch(`${this.url}/metrics`, { method: 'POST', body: JSON.stringify(metric), headers: { 'Content-Type': 'application/json' } })
      .then((response) => response.json())
      .then((data) => (data?.error ? Promise.reject(new Error(data.error)) : data));
  }
}
