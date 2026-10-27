import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ProjectHub } from './components/ProjectHub';
import './styles.css';
import './design/focus.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/^\/projekte\/?$/.test(window.location.pathname) ? <ProjectHub /> : <App />}
  </React.StrictMode>,
);
