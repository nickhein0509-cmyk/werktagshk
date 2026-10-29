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
// Account and learning views manage their own titles after mounting.
if (projectsRoute) document.title = 'WerkTag · Projekte';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {accountRoute ? <AccountPage /> : projectsRoute ? <ProjectHub /> : <App />}
  </React.StrictMode>,
);
