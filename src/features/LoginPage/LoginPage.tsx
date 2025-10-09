import React, {useEffect, useState} from 'react';
import {useDispatch} from "react-redux";
import {Link, useNavigate} from "react-router-dom";
import Popup from "reactjs-popup";

import styles from './LoginPage.module.scss';
import Error from "../../components/Error/Error";
import { useLanguage } from '../../state/language';
import {login} from "../../services/auth.service";
import { setToken } from "../../services/token.service";
import {
  keepUserAuthorized,
  recoverPassword,
  recoverPasswordSend,
  recoverPasswordVerify
} from "../../services/user.service";
import {fetchUser} from "../../slices/user.slice";
import appFetch from "../../utilities/appFetch";
import type { AppDispatch } from "../../store";

type LoginResponse = {
  code?: string;
  message?: string;
  data?: {
    token?: string;
    u_hash?: string;
  };
  auth_user?: Record<string, unknown>;
};

type UserCarResponse = {
  data?: {
    car?: Record<string, { c_id?: number }>;
  };
};

const RecoveryState = {
  IDLE: 0,
  PHONE: 1,
  CODE: 2
}

const LoginPage = () => {
  const text = useLanguage();

  // Оставила без изменений
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(false);

  const [recoveryState, setRecoveryState] = useState(RecoveryState.IDLE);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryUser, setRecoveryUser] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");

  useEffect(() => {
    document.title = text("Login");
  }, [text]);

  const onSendPhone = (e) => {
    e.preventDefault()
    e.stopPropagation()

    return recoverPassword({ phone: recoveryPhone })
      .then((res) => {
        setRecoveryUser(res.user_id)
        setRecoveryState(RecoveryState.CODE)
        setRecoveryError("")
      })
      .catch((err) => setRecoveryError(err.message))
  };

  const onSendCode = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const payload = {
      code: recoveryCode,
      user: recoveryUser
    }

    return recoverPasswordVerify(payload)
      .then(() => recoverPasswordSend({
        user_id: recoveryUser,
        code: recoveryCode,
        password: recoveryPassword
      }))
      .then(() => {
        setRecoveryError("")
        setRecoveryState(RecoveryState.IDLE)
      })
      .catch((err) => {
        if (typeof err.message === "string") {
          return setRecoveryError(err.message)
        }

        setRecoveryError(text("Unable to process the request"))
      })
  };

  const onSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = (await login(phone, password)) as LoginResponse;

      if (response?.code === "404") {
        setError(text("Incorrect data"));
        return;
      }

      const token = response?.data?.token;
      const hash = response?.data?.u_hash;

      if (!token || !hash) {
        setError(text("Unable to process the request"));
        return;
      }

      let carId: number | undefined;

      try {
        const profile = (await appFetch("user/authorized/car", {
          body: {
            u_hash: hash,
            token,
          },
        })) as UserCarResponse;

        const carEntries = Object.values(profile?.data?.car ?? {});
        if (carEntries.length > 0) {
          carId = carEntries[0]?.c_id;
        }
      } catch (profileError) {
        console.error("Failed to fetch additional user data", profileError);
      }

      setToken({
        hash,
        token,
        user: {
          ...(response?.auth_user ?? {}),
          ...(carId ? { c_id: carId } : {}),
        },
      });

      keepUserAuthorized(keep);

      dispatch(fetchUser());
      navigate("/");
    } catch (err: any) {
      setError(err?.message ?? text("Incorrect data"));
    }
  };

  return (
    // Изменила блок с формой
    <div className={`${styles.loginPage} appContainer`}>
      <h1 className={styles.loginPage_title}>{text("Login")}</h1>
      <form className={styles.loginPage_form} onSubmit={onSubmit}>
        {error && (
          // В старом коде className="auth-err"
          // Вынесла в отдельный компонент, т.к. переиспользуется
          <Error error={error} />
        )}
        <input
          className={styles.loginPage_form_input}
          type="text"
          name="phone"
          placeholder={text("Phone")}
          onChange={(e) => setPhone(e.target.value)}
          value={phone}
          required
        />
        <input
          className={styles.loginPage_form_input}
          type="password"
          name="password"
          placeholder={text("Password")}
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          required
        />

        <label className={styles.loginPage_form_loginKeep}>
          <input
            className={styles.loginPage_form_loginKeep_input}
            type="checkbox"
            // value={keep}
            onChange={(e) => setKeep(e.target.checked)}
          />
          {text("Stay logged in")}
        </label>

        <button className={styles.loginPage_form_button} type="submit">{text("Login")}</button>
      </form>

      <div className={styles.loginPage_options}>
        <span>{text("No account?")} </span>
        <Link to="/register" className={styles.loginPage_options_register}>{text("Register")}</Link>
        <span
          className={styles.loginPage_options_recovery}
          onClick={() => setRecoveryState(RecoveryState.PHONE)}
        >
          {text("Forgot password?")}
        </span>
      </div>

      {/*Оставила Popup без изменений*/}
      <Popup
        className="password-recovery__modal"
        open={recoveryState !== RecoveryState.IDLE}
        onClose={() => setRecoveryState(RecoveryState.IDLE)}
      >
        <button
          className="password-recovery__close"
          type="button"
          onClick={() => setRecoveryState(RecoveryState.IDLE)}
        >
          ×
        </button>
        <h2 className="password-recovery__title">
          {text("Password recovery")}
        </h2>
        <p className="password-recovery__info">
          {text("Enter your phone number, then a confirmation email will be sent to the email associated with your account.")}
        </p>
        {recoveryState === RecoveryState.CODE ? (
          <form
            className="password-recovery-form password-recovery-form--extended"
            onSubmit={onSendCode}
          >
            {recoveryError && (
              <div className="password-recovery-form__error">
                {recoveryError}
              </div>
            )}
            <input
              className="password-recovery-form__input password-recovery-form__input--extended"
              placeholder={text("Enter the code from email")}
              onChange={(e) => setRecoveryCode(e.target.value)}
              value={recoveryCode}
            />
            <input
              className="password-recovery-form__input password-recovery-form__input--extended"
              placeholder={text("New password")}
              onChange={(e) => setRecoveryPassword(e.target.value)}
              value={recoveryPassword}
            />
            <button className="password-recovery-form__button">
              {text("Send")}
            </button>

          </form>
        ) : (
          <form
            className="password-recovery-form"
            onSubmit={onSendPhone}
          >
            {recoveryError && (
              <div className="password-recovery-form__error">
                {recoveryError}
              </div>
            )}
            <input
              className="password-recovery-form__input"
              placeholder={text("Phone number")}
              onChange={(e) => setRecoveryPhone(e.target.value)}
              value={recoveryPhone}
            />
            <button className="password-recovery-form__button" type="submit">
              {text("Send")}
            </button>
          </form>
        )}
      </Popup>
    </div>
  );
};

export default LoginPage;
