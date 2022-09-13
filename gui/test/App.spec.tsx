import { render } from '@testing-library/react';
import { MetricsContext } from '../src/context/MetricsContext';
import { App } from '../src/App';
import { createMetricsContext } from './fixtures/createMetricsContext';

describe('App', () => {
  it('should have the header', async () => {
    const component = render(<App />);
    expect(component.getByText('ACI Monitoring Configuration')).toBeTruthy();
  });

  it('should try to load data initially', async () => {
    const context = createMetricsContext();
    render(
      <MetricsContext.Provider value={context}>
        <App />
      </MetricsContext.Provider>
    );
    expect(context.load.perform).toHaveBeenCalled();
  });

  it('should display loader while loading', async () => {
    const context = createMetricsContext();
    context.load.loading = true;
    const component = render(
      <MetricsContext.Provider value={context}>
        <App />
      </MetricsContext.Provider>
    );
    expect(component.container.querySelector('.MuiSkeleton-root')).toBeTruthy();
  });

  it('should display items when loaded', async () => {
    const context = createMetricsContext();
    context.items = [
      {
        name: 'name_1',
        className: 'class_name_1',
        attributes: ['attr1', 'attr2'],
        queryFilter: '',
        interval: 1000,
      },
      {
        name: 'name_2',
        className: 'class_name_2',
        attributes: ['attr3', 'attr4'],
        queryFilter: '',
        interval: 1000,
      },
    ];
    const component = render(
      <MetricsContext.Provider value={context}>
        <App />
      </MetricsContext.Provider>
    );
    expect(component.container.querySelector('.MuiSkeleton-root')).toBeFalsy();
    expect(component.container.querySelectorAll('.MuiCard-root').length).toBe(2);
    expect(component.getByText('name_1')).toBeTruthy();
    expect(component.getByText('name_2')).toBeTruthy();
  });
});
