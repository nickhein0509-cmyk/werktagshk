import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { ProjectHub } from './components/ProjectHub';
import { RouteBoundary, RouteLoading } from './components/RouteBoundary';
import './styles.css';
import './design/focus.css';
import './design/atelier.css';

// Keep account initialization and learning content out of the public chooser.
const App = lazy(() => import('./App'));
const AccountPage = lazy(() => import('./components/AccountPage').then((module) => ({
  default: module.AccountPage,
})));

const accountRoute = /^\/konto\/?$/.test(window.location.pathname);
const projectsRoute = /^\/projekte\/?$/.test(window.location.pathname);
// Account and learning views manage their own titles after mounting.
if (projectsRoute) document.title = 'WerkTag · Projekte';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouteBoundary>
      <Suspense fallback={<RouteLoading />}>
        {accountRoute ? <AccountPage /> : projectsRoute ? <ProjectHub /> : <App />}
      </Suspense>
    </RouteBoundary>
  </React.StrictMode>,
);
