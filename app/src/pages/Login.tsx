import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonInput,
  IonIcon,
  IonText,
  useIonToast,
  IonPage,
  IonFab,
  IonFabButton,
  isPlatform,
  IonImg,
} from "@ionic/react";
import {
  arrowBack,
  arrowForwardOutline,
  mailOutline,
  mailUnreadOutline,
} from "ionicons/icons";
import { Fragment, useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import toastError from "../../toastError";
import { loginEmail } from "../api/login";
import { StoreContext } from "../stores/Store";
import { AppLauncher } from "@capacitor/app-launcher";

const VERSION = import.meta.env.VITE_APP_VERSION;

enum State {
  idle,
  error,
  success,
  loading,
}

const KEYCODE_ENTER = 13;

export default function Login(props: { isLoggedIn: boolean }) {
  const { t } = useTranslation();
  const { login, connError } = useContext(StoreContext);
  const history = useHistory();
  const [present] = useIonToast();

  const modal = useRef<HTMLIonModalElement>(null);
  const inputEmail = useRef<HTMLIonInputElement>(null);
  const inputToken = useRef<HTMLIonInputElement>(null);

  const [isCapacitor] = useState(() => isPlatform("capacitor"));
  const [showToken, setShowToken] = useState(false);
  const [sentState, setSentState] = useState(State.idle);
  const [verifyState, setVerifyState] = useState(State.idle);
  const [sentTimeout, setSentTimeout] = useState<number>();
  const [tokenOverride, setTokenOverride] = useState("");

  function handleSendEmail() {
    if (sentState === State.success || sentState === State.loading) return;
    clearTimeout(sentTimeout);
    const email = inputEmail.current?.value + "";
    if (!email) return;
    setSentState(State.loading);

    (async () => {
      try {
        const res = await loginEmail(email + "", true);
        if (res.data && (res.data + "").length) {
          setTokenOverride(res.data + "");
        }
        setShowToken(true);
        setSentState(State.success);
        setSentTimeout(
          setTimeout(
            () => setSentState(State.idle),
            1000 * 60 /* 1 min */,
          ) as any,
        );
        inputEmail.current?.blur();
      } catch (err: any) {
        setSentState(State.error);
        toastError(present, err);
        console.error(err);
      }
    })();
  }

  function handleInputEmailEnter(e: any) {
    if (e?.keyCode === KEYCODE_ENTER) {
      handleSendEmail();
    }
  }

  function handleInputTokenEnter(e: any) {
    if (e?.keyCode === KEYCODE_ENTER) {
      handleVerifyToken();
    }
  }

  function handleVerifyToken() {
    if (verifyState === State.loading) return;
    let token = inputToken.current?.value || "";
    if (!token) {
      toastError(present, "Passcode required");
      return;
    }
    setVerifyState(State.loading);

    if (token === "12345678" && tokenOverride !== "") {
      token = tokenOverride;
    }

    (async () => {
      try {
        const email = inputEmail.current?.value + "";
        await login(email, token + "");
        setVerifyState(State.success);
        modal.current?.dismiss("success");
        history.replace("/settings", "select-loop");
      } catch (e: any) {
        toastError(present, e);
        if (!(e?.status === 401)) connError(e);
        setVerifyState(State.error);
      }
    })();
  }

  function openMailApp() {
    if (isPlatform("ios")) {
      window.location.href = "com.apple.mobilemail://";
    } else if (isPlatform("android")) {
      AppLauncher.openUrl({ url: "com.google.android.gm" });
    }
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>{t("login")}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="tw-h-full tw-flex tw-flex-col ion-padding">
          <div className="tw-shrink-0">
            <div className="tw-w-full tw-mb-16">
              <IonImg
                src="/v2_logo_white.png"
                className="tw-w-52 tw-hidden dark:tw-block tw-mx-auto"
              />
              <IonImg
                src="/v2_logo_black.png"
                className="tw-w-52 dark:tw-hidden tw-mx-auto"
              />
            </div>
            <IonHeader collapse="condense" className="ion-margin-bottom">
              <IonToolbar>
                <IonTitle size="large">{t("login")}</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonItem lines="none">
              <IonText>{t("pleaseEnterYourEmailAddress")}</IonText>
            </IonItem>
            <IonItem lines="none">
              <IonInput
                label={t("email")!}
                labelPlacement="fixed"
                ref={inputEmail}
                type="email"
                autocomplete="email"
                autoSave="on"
                autofocus
                enterkeyhint="send"
                onKeyUp={handleInputEmailEnter}
                aria-autocomplete="list"
                required
                placeholder={t("yourEmailAddress")!}
              />
            </IonItem>
            <IonItem
              lines="none"
              className="tw-text-right tw-mt-4 tw-bg-transparent"
            >
              {isCapacitor && showToken ? (
                <IonButton
                  key="open-mail-app"
                  size="default"
                  slot="end"
                  shape="round"
                  color="light"
                  className="tw-me-4"
                  onClick={openMailApp}
                >
                  {t("openMailApp")}
                </IonButton>
              ) : null}
              <IonButton
                size="default"
                slot="end"
                shape="round"
                color={
                  sentState === State.idle
                    ? "primary"
                    : sentState === State.success
                      ? "success"
                      : sentState === State.loading
                        ? "medium"
                        : "danger"
                }
                disabled={sentState === State.success}
                onClick={handleSendEmail}
              >
                {sentState === State.loading ? t("loading") : t("send")}
                {sentState === State.success ? (
                  <IonIcon slot="end" icon={mailUnreadOutline} />
                ) : sentState === State.loading ? null : (
                  <IonIcon slot="end" icon={mailOutline} />
                )}
              </IonButton>
            </IonItem>
            {showToken ? (
              <Fragment key="token">
                <IonItem lines="none" className="ion-margin-top">
                  <IonText>
                    {t("enterThePasscodeYouReceivedInYourEmail")}
                  </IonText>
                </IonItem>
                <IonItem lines="none">
                  <IonInput
                    type="number"
                    ref={inputToken}
                    autoCorrect="off"
                    placeholder="••••••"
                    label={t("passcode")!}
                    enterkeyhint="enter"
                    onKeyUp={handleInputTokenEnter}
                    labelPlacement="fixed"
                  />
                </IonItem>
                <IonItem lines="none">
                  <IonButton
                    shape="round"
                    color={
                      verifyState === State.idle
                        ? "primary"
                        : verifyState === State.success
                          ? "success"
                          : verifyState === State.loading
                            ? "medium"
                            : "danger"
                    }
                    size="default"
                    disabled={verifyState === State.success}
                    slot="end"
                    expand="block"
                    onClick={handleVerifyToken}
                  >
                    {verifyState === State.loading ? t("loading") : t("login")}
                    {verifyState === State.loading ? null : (
                      <IonIcon slot="end" icon={arrowForwardOutline} />
                    )}
                  </IonButton>
                </IonItem>
              </Fragment>
            ) : null}
            <div
              className="tw-text-center tw-mt-2 -tw-mb-4 tw-text-medium"
              key="version"
            >
              {VERSION}
            </div>
          </div>
          <div className="tw-relative tw-flex-grow -tw-m-4 tw-mt-8 tw-inset-0 -tw-z-10 tw-bg-green tw-overflow-hidden">
            <div className="tw-absolute tw-overflow-hidden tw-inset-0 -tw-z-10">
              <IonIcon
                aria-hidden="true"
                icon="/v2_o_pattern_green.svg"
                style={{ fontSize: 400 }}
                className="tw-absolute -tw-left-28 -tw-bottom-[170px] tw-text-green dark:tw-text-primary-shade"
              />
            </div>
          </div>
        </div>
        <IonFab vertical="bottom" horizontal="start">
          <IonFabButton
            color="light"
            onClick={() => history.replace("/onboarding/2")}
            className="ion-margin-bottom"
          >
            <IonIcon icon={arrowBack}></IonIcon>
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
}
