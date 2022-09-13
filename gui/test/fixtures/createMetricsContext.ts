import { Context } from 'react';
import { MetricsContext } from '../../src/context/MetricsContext';

type MetricsContextValue = typeof MetricsContext extends Context<infer T> ? T : never;

export const createMetricsContext = (): MetricsContextValue => ({
  items: [],
  add: { loading: false, error: null, perform: jest.fn(), reset: jest.fn() },
  delete: { loading: false, error: null, perform: jest.fn(), reset: jest.fn() },
  load: { loading: false, error: null, perform: jest.fn(), reset: jest.fn() },
});
