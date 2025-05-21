import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useLocation,
} from "react-router-dom";
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  getPlatforms,
  setupIonicReact,
  useIonToast,
} from "@ionic/react";
import { SplashScreen } from "@capacitor/splash-screen";
import {
  bookOutline,
  homeOutline,
  cubeOutline,
  peopleCircleOutline,
  chatbubblesOutline,
  pauseCircleOutline,
} from "ionicons/icons";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import "./theme/utilities.css";
import "./theme/overrides.css";
/* Theme changes for development */
// import "./theme/dev.css";
import { IsAuthenticated, StoreContext } from "./stores/Store";
import { useContext, useEffect, useMemo } from "react";

import { useTranslation } from "react-i18next";
import dayjs from "./dayjs";
import { OneSignalInitCap } from "./onesignal";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import BagSVG from "./components/Bags/Svg";
import IsPaused from "./utils/is_paused";
import toastError from "../toastError";

// routes
import HelpList from "./pages/HelpList";
import { OnboardingPageOne, OnboardingPageTwo } from "./pages/Onboarding";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import OpenSource from "./pages/OpenSource";
import HelpItem from "./pages/HelpItem";
import AddressList from "./pages/AddressList";
import AddressItem from "./pages/AddressItem";
import BagsList from "./pages/BagsList";
import BulkyList from "./pages/BulkyList";
import Chat from "./pages/Chat";
import PrivacyPolicy from "./pages/PrivacyPolicy";

import { ChatContext } from "./stores/Chat";
import Login from "./pages/Login";
import Settings from "./pages/Settings";

SplashScreen.show({
  autoHide: true,
});

setupIonicReact({
  mode: "ios",
});

export default function Routes() {
  const { isAuthenticated, init, authenticate, chain, connError } =
    useContext(StoreContext);
  const history = useHistory();
  let location = useLocation();
  const [present] = useIonToast();

  // initialize one signal, run initial calls and capture error events
  useEffect(() => {
    (async () => {
      const platforms = getPlatforms();
      if (platforms.includes("capacitor")) {
        await OneSignalInitCap().catch((err) => {
          console.error(err);
          toastError(present, err, "Notification service is broken");
        });
      }
      await auth();
    })();
  }, []);

  // set the chain theme, and change when selected chain is changed
  useEffect(() => {
    if (!chain || chain.theme === undefined) return;
    const bodyEl = document.getElementsByTagName("body")[0];

    let theme = chain.theme;
    if (theme === "grey" || !theme) theme = "default";

    bodyEl.setAttribute("data-theme", theme);
  }, [chain]);

  async function auth() {
    let success = IsAuthenticated.Unknown;
    let err: Error | undefined;
    try {
      await init();
      success = await authenticate();
    } catch (e: any) {
      err = e;
    }
    SplashScreen.hide();
    if (err) return connError(err);

    if (
      success === IsAuthenticated.LoggedIn ||
      success === IsAuthenticated.OfflineLoggedIn
    )
      history.replace("/help");
    else history.replace("/onboarding");
  }

  return (
    <IonApp>
      <Switch location={location}>
        <Redirect exact from="/login" to="/onboarding/3" />
        <Route path="/onboarding" component={OnboardingRoute} />
        <PrivateRoute isAuthenticated={isAuthenticated}>
          <AppRoute />
        </PrivateRoute>
      </Switch>
    </IonApp>
  );
}

function OnboardingRoute() {
  const location = useLocation();
  return (
    <TransitionGroup>
      <CSSTransition classNames="fade" timeout={400} key={location.key}>
        <Switch location={location}>
          <Redirect exact from="/onboarding" to="/onboarding/1" />
          <Route exact path="/onboarding/1" component={OnboardingPageOne} />
          <Route exact path="/onboarding/2" component={OnboardingPageTwo} />
          <Route exact path="/onboarding/3" component={Login} />
        </Switch>
      </CSSTransition>
    </TransitionGroup>
  );
}

const ChangeTabs = ["help", "address", "bags", "bulky-items", "settings"];

function AppRoute() {
  const { t } = useTranslation();
  const { refresh, bags, authUser, chain, listOfChains } =
    useContext(StoreContext);
  const { showNotification } = useContext(ChatContext);
  const isPaused = IsPaused(authUser, chain?.uid);

  const hasBagTooOldMe = useMemo(() => {
    let hasBagTooOldMe = false;
    for (let b of bags) {
      const updatedAt = dayjs(b.updated_at);
      const now = dayjs();
      if (!updatedAt.isBefore(now.add(-7, "days"))) {
        // skip if bag is newer than 7 days old
        continue;
      }
      if (b.user_uid === authUser?.uid) {
        hasBagTooOldMe = true;
        break;
      }
    }

    return hasBagTooOldMe;
  }, [bags]);

  function handleTabsWillChange(e: CustomEvent<{ tab: string }>) {
    const tab = e.detail.tab;
    const tabIndex = ChangeTabs.indexOf(tab);
    // console.log("tab change", tab);
    if (tabIndex === -1) return;
    refresh(tab);
  }

  const hasOneChain = listOfChains?.length === 1;
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Redirect exact path="/" to="/help" />
        <Route exact path="/help" component={HelpList}></Route>
        <Route path="/help/:index" component={HelpItem}></Route>
        <Route exact path="/address" component={AddressList}></Route>
        <Route path="/address/:uid" component={AddressItem}></Route>
        <Route exact path="/bags" component={BagsList}></Route>
        <Route exact path="/bulky-items" component={BulkyList}></Route>
        <Route exact path="/chat" component={Chat}></Route>
        <Route exact path="/settings" component={Settings}></Route>
        <Route
          exact
          path="/settings/privacy-policy"
          component={PrivacyPolicy}
        ></Route>
        <Route
          exact
          path="/settings/open-source"
          component={OpenSource}
        ></Route>
      </IonRouterOutlet>
      <div slot="bottom" className="">
        <IonTabBar
          onIonTabsWillChange={handleTabsWillChange}
          className={hasOneChain ? "" : "tw-mb-4"}
        >
          <IonTabButton
            tab="help"
            href="/help"
            className="!tw-overflow-visible"
          >
            <IonIcon aria-hidden="true" icon={bookOutline} />
            <IonLabel>{t("rules")}</IonLabel>
          </IonTabButton>
          <IonTabButton tab="address" href="/address" disabled={!chain}>
            {isPaused ? (
              <IonIcon
                aria-hidden="true"
                icon={pauseCircleOutline}
                color="medium"
              />
            ) : (
              <IonIcon aria-hidden="true" icon={homeOutline} />
            )}
            <IonLabel>{t("route")}</IonLabel>
          </IonTabButton>
          <IonTabButton tab="bags" href="/bags" disabled={!chain}>
            <div className="tw-w-[24px] tw-h-[24px] tw-my-0.5 tw-scale-110">
              <BagSVG bag={{ number: "", color: "currentColor" }} isList />
            </div>
            {hasBagTooOldMe ? (
              <div className="tw-rounded-full tw-w-2.5 tw-h-2.5 tw-absolute tw-top-[3px] tw-left-[calc(50%+10px)] tw-ring-1 tw-ring-text tw-bg-danger"></div>
            ) : null}
            <IonLabel className="tw-text-[10px]">{t("bags")}</IonLabel>
          </IonTabButton>
          {chain?.is_app_disabled ? (
            <IonTabButton tab="chat" href="/chat" disabled={!chain}>
              <IonIcon aria-hidden="true" icon={cubeOutline} />
              <IonLabel>{t("bulkyItems")}</IonLabel>
            </IonTabButton>
          ) : (
            <IonTabButton tab="chat" href="/chat" disabled={!chain}>
              <IonIcon aria-hidden="true" icon={chatbubblesOutline} />
              {showNotification ? (
                <div className="tw-rounded-full tw-w-2.5 tw-h-2.5 tw-absolute tw-top-[3px] tw-left-[calc(50%+10px)] tw-ring-1 tw-ring-text tw-bg-danger"></div>
              ) : null}
              <IonLabel>{t("chat")}</IonLabel>
            </IonTabButton>
          )}

          <IonTabButton tab="settings" href="/settings">
            <IonIcon aria-hidden="true" icon={peopleCircleOutline} />
            <IonLabel>{t("info")}</IonLabel>
          </IonTabButton>
        </IonTabBar>
        {hasOneChain ? null : (
          <div className="tw-absolute tw-bottom-0 tw-w-full tw-bg-primary">
            <div
              className="tw-h-4 tw-w-full"
              style={{ marginBottom: "var(--ion-safe-area-bottom, 0)" }}
            >
              {chain ? (
                <div className="tw-text-xs tw-text-center tw-text-background tw-font-bold tw-bg-primary">
                  {chain.name}
                </div>
              ) : (
                <div className="tw-text-xs tw-text-center tw-text-background tw-italic tw-bg-danger">
                  {"No Loop selected"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </IonTabs>
  );
}
