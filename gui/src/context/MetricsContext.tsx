import { FC, ReactNode, createContext, useState } from 'react';
import { Metric } from '../types';
import { ApiClient } from '../api';
import { apiUrl } from '../config';

export const MetricsContext = createContext<{
  items: Metric[];
  load: {
    loading: boolean;
    error: Error | null;
    perform: () => void;
    reset: () => void;
  };
  add: {
    loading: boolean;
    error: Error | null;
    perform: (data: Metric) => void;
    reset: () => void;
  };
  delete: {
    loading: boolean;
    error: Error | null;
    perform: (name: string) => void;
    reset: () => void;
  };
}>({
  items: [],
  load: {
    loading: false,
    error: null,
    perform: () => {},
    reset: () => {},
  },
  add: {
    loading: false,
    error: null,
    perform: () => {},
    reset: () => {},
  },
  delete: {
    loading: false,
    error: null,
    perform: () => {},
    reset: () => {},
  },
});

export const MetricsContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [ items, setItems ] = useState<Metric[]>([]);
  const [ loading, setLoading ] = useState(false);
  const [ loadError, setLoadError ] = useState<Error | null>(null);
  const [ adding, setAdding ] = useState(false);
  const [ addError, setAddError ] = useState<Error | null>(null);
  const [ deleting, setDeleting ] = useState(false);
  const [ deleteError, setDeleteError ] = useState<Error | null>(null);

  const client = new ApiClient(apiUrl);

  const loadMetrics = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setItems(await client.getMetrics());
      setLoading(false);
    } catch (e) {
      setLoadError(e);
      setLoading(false);
    }
  };

  const addMetric = async (metric: Metric) => {
    if (adding) {
      return;
    }

    try {
      setAdding(true);
      setItems(await client.addMetric(metric));
      setAdding(false);
    } catch (e) {
      setAddError(e);
      setAdding(false);
    }
  };

  const deleteMetric = async (name: string) => {
    if (deleting) {
      return;
    }

    try {
      setDeleting(true);
      setItems(await client.deleteMetric(name));
      setDeleting(false);
    } catch (e) {
      setDeleteError(e);
      setDeleting(false);
    }
  };

  return (
    <MetricsContext.Provider value={{
      items,
      load: { loading, error: loadError, perform: loadMetrics, reset: () => setLoadError(null) },
      add: { loading: adding, error: addError, perform: addMetric, reset: () => setAddError(null) },
      delete: { loading: deleting, error: deleteError, perform: deleteMetric, reset: () => setDeleteError(null) },
    }}>
      {children}
    </MetricsContext.Provider>
  );
};
