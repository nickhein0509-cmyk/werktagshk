import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ProjectHub } from './components/ProjectHub';
import { AccountPage } from './components/AccountPage';
import './styles.css';
import './design/focus.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/^\/konto\/?$/.test(window.location.pathname) ? <AccountPage /> : /^\/projekte\/?$/.test(window.location.pathname) ? <ProjectHub /> : <App />}
  </React.StrictMode>,
);
