import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MetricsContextProvider } from './context/MetricsContext';
import { App } from './App';

// Ensure root element

const element = document.querySelector('#root') || document.createElement('div');
element.id = 'root';
if (element.parentNode !== document.body) {
  document.body.appendChild(element);
}

// Render the application

createRoot(element).render(createElement(MetricsContextProvider, null, createElement(App, null)));
