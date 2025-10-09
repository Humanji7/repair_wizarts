import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";

import styles from './RegistrationUserPage.module.scss';
import ConfirmPolitics from "../../../components/ConfirmPolitics/ConfirmPolitics";
import {ConfirmPoliticsContext} from "../../../components/ConfirmPolitics/ConfirmPoliticsContext";
import Error from "../../../components/Error/Error";
import { useLanguage } from '../../../state/language';
import {registerAsClient} from "../../../services/auth.service";
import { setToken } from "../../../services/token.service";

type RegisterResponse = {
  code?: string;
  message?: string;
  data?: {
    token?: string;
    u_hash?: string;
  };
  auth_user?: Record<string, unknown>;
};

const RegistrationUserPage = () => {
  const text = useLanguage(); // функция для перевода

  useEffect(() => {
    document.title =  text('Registration');
  }, [text]);

  const navigate = useNavigate();

  const [error, setError] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVerification, setPasswordVerification] = useState("");
  const [accept, setAccept] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!accept) {
      setError(text("To continue, you must accept the privacy policy."));
      return;
    }

    setError(undefined);

    try {
      const response = (await registerAsClient({
        name,
        lastname,
        email,
        phone,
        password1: password,
        password2: passwordVerification,
      })) as RegisterResponse;

      if (response?.code === "404") {
        setError(response?.message ?? text("Unable to process the request"));
        return;
      }

      const token = response?.data?.token;
      const hash = response?.data?.u_hash;

      if (token && hash) {
        setToken({
          hash,
          token,
          user: {
            ...(response?.auth_user ?? {}),
            u_name: `${name.trim()} ${lastname.trim()}`.trim(),
            u_phone: phone,
            u_email: email,
          },
        });

        setAccept(false);
        navigate("/");
        return;
      }

      navigate("/login");
    } catch (err: any) {
      setError(err?.message ?? text("Unable to process the request"));
    }
  };

  return (
    <ConfirmPoliticsContext.Provider value={{accept, setAccept}}>
      <div className={`${styles.registrationUserPage} appContainer`}>
        <h1 className={styles.registrationUserPage_title}>{text('Registration')}</h1>
         <form className={styles.registrationUserPage_form} onSubmit={onSubmit}>
           {error && (
             <Error error={error} />
           )}
           <input
             className={styles.registrationUserPage_form_input}
             type="text"
             name="name"
             placeholder={text("First Name")}
             value={name}
             onChange={(e) => setName(e.target.value)}
             required
           />
           <input
             className={styles.registrationUserPage_form_input}
             type="text"
             name="lastname"
             placeholder={text("Last Name")}
             value={lastname}
             onChange={(e) => setLastname(e.target.value)}
             required
           />
           <input
             className={styles.registrationUserPage_form_input}
             type="email"
             name="email"
             placeholder={text("Email")}
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
           />
           <input
             className={styles.registrationUserPage_form_input}
             type="text"
             name="phone"
             placeholder={text("Phone")}
             value={phone}
             onChange={(e) => setPhone(e.target.value)}
             required
           />
           <input
             className={styles.registrationUserPage_form_input}
             type="password"
             name="password"
             placeholder={text("Password")}
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
           />
           <input
             className={styles.registrationUserPage_form_input}
             type="password"
             placeholder={text("Confirm Password")}
             value={passwordVerification}
             onChange={(e) => setPasswordVerification(e.target.value)}
             required
           />

           {/*Вынесла в отдельный компонент, т.к. будет переиспользован*/}
           <ConfirmPolitics />

           <button className={styles.registrationUserPage_form_button} type="submit">{text("Register")}</button>
         </form>
      </div>
    </ConfirmPoliticsContext.Provider>
  );
};

export default RegistrationUserPage;
