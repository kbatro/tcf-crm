import {
  type CoreAdminProps,
  CustomRoutes,
  localStorageStore,
  Resource,
  type AuthProvider,
} from "ra-core";
import { useMemo } from "react";
import { Route } from "react-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Admin } from "@/components/admin/admin";
import { ForgotPasswordPage } from "@/components/supabase/forgot-password-page";
import { SetPasswordPage } from "@/components/supabase/set-password-page";
import { OAuthConsentPage } from "@/components/supabase/oauth-consent-page";

import companies from "../companies";
import contacts from "../contacts";
import { Dashboard } from "../dashboard/Dashboard";
import { MobileDashboard } from "../dashboard/MobileDashboard";
import intentions from "../intentions";
import { Layout } from "../layout/Layout";
import { MobileLayout } from "../layout/MobileLayout";
import { SignupPage } from "../login/SignupPage";
import { ConfirmationRequired } from "../login/ConfirmationRequired";
import { ImportPage } from "../misc/ImportPage";
import {
  authProvider as defaultAuthProvider,
  dataProvider as defaultDataProvider,
} from "../providers/supabase";
import actors from "../actors";
import { SettingsPageMobile } from "../settings/SettingsPageMobile";
import { ProfilePage } from "../settings/ProfilePage";
import { SettingsPage } from "../settings/SettingsPage";
import {
  CONFIGURATION_STORE_KEY,
  type ConfigurationContextValue,
} from "./ConfigurationContext";
import type { CrmDataProvider } from "../providers/types";
import {
  defaultCompanySectors,
  defaultCurrency,
  defaultDarkModeLogo,
  defaultIntentionTypes,
  defaultIntentionSuccessStatuses,
  defaultIntentionStatuses,
  defaultLightModeLogo,
  defaultNoteStatuses,
  defaultTaskTypes,
  defaultTitle,
} from "./defaultConfiguration";
import { i18nProvider } from "../providers/commons/i18nProvider";
import { StartPage } from "../login/StartPage.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { MobileTasksList } from "../tasks/MobileTasksList.tsx";
import { ContactListMobile } from "../contacts/ContactList.tsx";
import { ContactShow } from "../contacts/ContactShow.tsx";
import { CompanyShow } from "../companies/CompanyShow.tsx";
import { NoteShowPage } from "../notes/NoteShowPage.tsx";

const defaultStore = localStorageStore(undefined, "CRM");

export type CRMProps = {
  dataProvider?: CrmDataProvider;
  authProvider?: AuthProvider;
  store?: CoreAdminProps["store"];
} & Partial<ConfigurationContextValue>;

/**
 * CRM Component
 *
 * This component sets up and renders the main CRM application using `ra-core`.
 */
export const CRM = ({
  companySectors = defaultCompanySectors,
  currency = defaultCurrency,
  intentionTypes = defaultIntentionTypes,
  intentionSuccessStatuses = defaultIntentionSuccessStatuses,
  intentionStatuses = defaultIntentionStatuses,
  darkModeLogo = defaultDarkModeLogo,
  lightModeLogo = defaultLightModeLogo,
  noteStatuses = defaultNoteStatuses,
  taskTypes = defaultTaskTypes,
  title = defaultTitle,
  dataProvider = defaultDataProvider,
  authProvider = defaultAuthProvider,
  store = defaultStore,
  googleWorkplaceDomain = import.meta.env.VITE_GOOGLE_WORKPLACE_DOMAIN,
  disableEmailPasswordAuthentication = import.meta.env
    .VITE_DISABLE_EMAIL_PASSWORD_AUTHENTICATION === "true",
  ...rest
}: CRMProps) => {
  // Seed the store with CRM prop values if not already stored
  if (!store.getItem(CONFIGURATION_STORE_KEY)) {
    store.setItem(CONFIGURATION_STORE_KEY, {
      companySectors,
      currency,
      intentionTypes,
      intentionSuccessStatuses,
      intentionStatuses,
      noteStatuses,
      taskTypes,
      title,
      darkModeLogo,
      lightModeLogo,
      googleWorkplaceDomain,
      disableEmailPasswordAuthentication,
    } satisfies ConfigurationContextValue);
  }

  const isMobile = useIsMobile();

  const wrappedAuthProvider = useMemo<AuthProvider>(
    () => ({
      ...authProvider,
      login: async (params: any) => {
        const result = await authProvider.login(params);
        try {
          const config = await dataProvider.getConfiguration();
          if (Object.keys(config).length > 0) {
            store.setItem(CONFIGURATION_STORE_KEY, config);
          }
        } catch {
          // Non-critical: config will load via useConfigurationLoader
        }
        return result;
      },
      handleCallback: async (params: any) => {
        if (!authProvider.handleCallback) {
          throw new Error(
            "handleCallback is not implemented in the authProvider",
          );
        }
        const result = await authProvider.handleCallback(params);
        try {
          const config = await dataProvider.getConfiguration();
          if (Object.keys(config).length > 0) {
            store.setItem(CONFIGURATION_STORE_KEY, config);
          }
        } catch {
          // Non-critical: config will load via useConfigurationLoader
        }
        return result;
      },
      logout: async (params: any) => {
        try {
          store.removeItem(CONFIGURATION_STORE_KEY);
        } catch {
          // Ignore
        }
        return authProvider.logout(params);
      },
    }),
    [authProvider, dataProvider, store],
  );

  const ResponsiveAdmin = isMobile ? MobileAdmin : DesktopAdmin;

  return (
    <ResponsiveAdmin
      dataProvider={dataProvider}
      authProvider={wrappedAuthProvider}
      i18nProvider={i18nProvider}
      store={store}
      loginPage={StartPage}
      requireAuth
      disableTelemetry
      {...rest}
    />
  );
};

const DesktopAdmin = (props: CoreAdminProps) => {
  return (
    <Admin layout={Layout} dashboard={Dashboard} {...props}>
      <CustomRoutes noLayout>
        <Route path={SignupPage.path} element={<SignupPage />} />
        <Route
          path={ConfirmationRequired.path}
          element={<ConfirmationRequired />}
        />
        <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
        <Route
          path={ForgotPasswordPage.path}
          element={<ForgotPasswordPage />}
        />
        <Route path={OAuthConsentPage.path} element={<OAuthConsentPage />} />
      </CustomRoutes>

      <CustomRoutes>
        <Route path={ProfilePage.path} element={<ProfilePage />} />
        <Route path={SettingsPage.path} element={<SettingsPage />} />
        <Route path={ImportPage.path} element={<ImportPage />} />
      </CustomRoutes>
      <Resource name="intentions" {...intentions} />
      <Resource name="contacts" {...contacts} />
      <Resource name="companies" {...companies} />
      <Resource name="notes" />
      <Resource name="intention_contacts" />
      <Resource name="assignments" />
      <Resource name="tasks" />
      <Resource name="actors" {...actors} />
      <Resource name="tags" />
    </Admin>
  );
};

const MobileAdmin = (props: CoreAdminProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        networkMode: "offlineFirst",
      },
      mutations: {
        networkMode: "offlineFirst",
      },
    },
  });
  const asyncStoragePersister = createAsyncStoragePersister({
    storage: localStorage,
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <Admin
        queryClient={queryClient}
        layout={MobileLayout}
        dashboard={MobileDashboard}
        {...props}
      >
        <CustomRoutes noLayout>
          <Route path={SignupPage.path} element={<SignupPage />} />
          <Route
            path={ConfirmationRequired.path}
            element={<ConfirmationRequired />}
          />
          <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
          <Route
            path={ForgotPasswordPage.path}
            element={<ForgotPasswordPage />}
          />
          <Route path={OAuthConsentPage.path} element={<OAuthConsentPage />} />
        </CustomRoutes>
        <CustomRoutes>
          <Route
            path={SettingsPageMobile.path}
            element={<SettingsPageMobile />}
          />
        </CustomRoutes>
        <Resource
          name="contacts"
          list={ContactListMobile}
          show={ContactShow}
          recordRepresentation={contacts.recordRepresentation}
        >
          <Route path=":id/notes/:noteId" element={<NoteShowPage />} />
        </Resource>
        <Resource name="companies" show={CompanyShow} />
        <Resource name="tasks" list={MobileTasksList} />
      </Admin>
    </PersistQueryClientProvider>
  );
};
