export interface Metric {
  name: string;
  className: string;
  attributes: string[];
  queryFilter: string;
  interval: number;
}
