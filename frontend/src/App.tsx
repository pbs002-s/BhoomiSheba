import SurveyField from './components/SurveyField';
import { RouterProvider, useRouter } from './lib/router';
import { useTheme } from './lib/theme';
import { LanguageProvider } from './lib/language';
import Landing from './routes/Landing';
import SignIn from './routes/SignIn';
import Dashboard from './routes/Dashboard';

function Routes() {
  const { path } = useRouter();
  const { theme, toggle } = useTheme();

  const page =
    path.startsWith('/signin') ? <SignIn theme={theme} onToggleTheme={toggle} /> :
    path.startsWith('/app') ? <Dashboard theme={theme} onToggleTheme={toggle} /> :
    <Landing theme={theme} onToggleTheme={toggle} />;

  return (
    <>
      {/* The ambient sheet sits behind every route, so the product feels
          like one continuous document rather than three separate screens. */}
      <SurveyField theme={theme} />
      {page}
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider>
        <Routes />
      </RouterProvider>
    </LanguageProvider>
  );
}
