import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ProjectHub } from './components/ProjectHub';
import { AccountPage } from './components/AccountPage';
import './styles.css';
import './design/focus.css';
import './design/atelier.css';

const accountRoute = /^\/konto\/?$/.test(window.location.pathname);
const projectsRoute = /^\/projekte\/?$/.test(window.location.pathname);
document.title = accountRoute
  ? 'WerkTag · Konto & Anmeldung'
  : projectsRoute
    ? 'WerkTag · Projekte'
    : 'WerkTag · Lernen';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {accountRoute ? <AccountPage /> : projectsRoute ? <ProjectHub /> : <App />}
  </React.StrictMode>,
);
