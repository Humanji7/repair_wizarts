import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { registerAsClient } from '../../services/auth.service';
import '../../scss/register.css';
import SERVER_PATH from '../../constants/SERVER_PATH';
import { setToken } from '../../services/token.service';
import PhoneInput, { isPhoneNumberComplete } from '../../shared/ui/PhoneInput/PhoneInput';

function Register() {
  const navigate = useNavigate();

  const [error, setError] = useState();
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+7(');
  const [password, setPassword] = useState('');
  const [passwordVerification, setPasswordVerification] = useState('');
  const [accept, setAccept] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();

    if (!accept) {
      return setError(
        'Чтобы продолжить необходимо принять политику конфиденциальности.',
      );
    }

    if (!isPhoneNumberComplete(phone)) {
      return setError('Введите полный номер телефона.');
    }

    return registerAsClient({
      u_name: name + ' ' + lastname,
      u_phone: phone,
      u_email: email,
      u_password: password,
    })
      .then((data) => {
        if (data.code === '404') return setError(data.message);
        setToken({
          hash: data.data.u_hash,
          token: data.data.token,
          user: {
            u_id: data.data.u_id,
            u_name: name + ' ' + lastname,
            u_phone: phone,
            u_email: email,
            u_password: password,
          },
        });
        navigate('/');
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    document.title = 'Регистрация';
  }, []);

  const onPhoneValidation = (message) => {
    setError(message);
  };
  return (
    <section className="register">
      <h1>Регистрация</h1>
      <form onSubmit={onSubmit}>
        {error && <div className="auth-err">{error}</div>}

        <input
          required
          type="text"
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="heheinput"
          placeholder="Имя"
        />
        <input
          required
          type="text"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          className="heheinput"
          placeholder="Фамилия"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="heheinput"
          placeholder="Email"
        />
        <div className="input_phone_wrap">
          <PhoneInput
            className={`heheinput ${
              phone.length > 4 ? 'phone_input_accent' : 'phone_input_lite'
            }`}
            name="phone"
            placeholder="Телефон"
            value={phone}
            onChange={(nextValue) => setPhone(nextValue)}
            onValidationError={onPhoneValidation}
            required
          />
        </div>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="heheinput"
          placeholder="Пароль"
        />
        <input
          required
          type="password"
          value={passwordVerification}
          onChange={(e) => setPasswordVerification(e.target.value)}
          className="heheinput"
          placeholder="Подтвердите пароль"
        />
        <div className="rel">
          <input
            type="checkbox"
            id="really"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
          />
          <label htmlFor="really">
            Ознакомлен и согласен с условиями
            <a
              style={{
                textDecoration: 'underline',
                marginLeft: '5px',
                color: '#000',
              }}
              target="_blank"
              rel="noopener noreferrer"
              href={SERVER_PATH + 'files/privacy-policy.pdf'}
            >
              Политики конфиденциальности
            </a>
          </label>
        </div>
        <button>Регистрация</button>
      </form>
    </section>
  );
}

export default Register;
