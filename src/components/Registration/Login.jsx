import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

import { fetchUser } from '../../slices/user.slice'
import { login } from '../../services/auth.service'

import './login.css'
import Popup from 'reactjs-popup'

import { keepUserAuthorized, recoverPassword, recoverPasswordSend, recoverPasswordVerify } from '../../services/user.service'
import PhoneInput, { isPhoneNumberComplete } from '../../shared/ui/PhoneInput/PhoneInput'

const RecoveryState = {
    IDLE: 0,
    PHONE: 1,
    CODE: 2
}

function Login() {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [error, setError] = useState("")
    const [phone, setPhone] = useState("+7(")
    const [password, setPassword] = useState("")
    const [keep, setKeep] = useState(false)

    const [recoveryState, setRecoveryState] = useState(RecoveryState.IDLE)
    const [recoveryError, setRecoveryError] = useState("")
    const [recoveryUser, setRecoveryUser] = useState("")
    const [recoveryPassword, setRecoveryPassword] = useState("")
    const [recoveryPhone, setRecoveryPhone] = useState("+7(")
    const [recoveryCode, setRecoveryCode] = useState("")

    const onSendPhone = (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isPhoneNumberComplete(recoveryPhone)) {
            setRecoveryError('Введите полный номер телефона.')
            return
        }

        return recoverPassword({ phone: recoveryPhone })
            .then((res) => {
                setRecoveryUser(res.user_id)
                setRecoveryState(RecoveryState.CODE)
                setRecoveryError("")
            })
            .catch((err) => setRecoveryError(err.message))
    }
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

                setRecoveryError("Невозможно выполнить запрос")
            })
    }

    useEffect(() => {
        document.title = 'Войти';
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault()

        if (!isPhoneNumberComplete(phone)) {
            setError('Введите полный номер телефона.')
            return
        }

        try {
            await login(phone, password)

            if (keep) {
                keepUserAuthorized(true)
            } else {
                keepUserAuthorized(false)
            }

            dispatch(fetchUser())
            navigate("/")
        } catch (err) {
            setError("Некорректные данные")
        }
    }

    return (
        <section className="login">
            <h1>Войти</h1>
            <form onSubmit={onSubmit}>
                {error && (
                    <div className="auth-err">
                        {error}
                    </div>
                )}
                <div className="input_phone_wrap">
                    <PhoneInput
                        className={phone.length > 4 ? 'phone_input_accent' : 'phone_input_lite'}
                        name="phone"
                        value={phone}
                        onChange={(nextValue) => setPhone(nextValue)}
                        onValidationError={(message) => setError(message)}
                        required
                    />
                </div>
                {/* <input
                    type="text"
                    value={phone}
                    onChange={handleChange}
                    placeholder="Телефон"
                    required
                /> */}
                <input
                    type="password"
                    placeholder="Пароль"
                    className="input_login_password__fix"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    required
                />
                <label className="login-keep">
                    <input
                        type="checkbox"
                        value={keep}
                        className="login-keep__input"
                        onChange={(e) => setKeep(e.target.checked)}
                    />
                    Оставаться в системе
                </label>

                <button className="log__btn">Войти</button>

                <div>
                    <span>Нет аккаунта? </span>
                    <Link to="/register" style={{ fontSize: "16px" }}>Зарегистрируйтесь</Link>
                </div>
                <span
                    style={{
                        marginTop: "6px",
                        textDecoration: "underline",
                        cursor: "pointer"
                    }}
                    onClick={() => setRecoveryState(RecoveryState.PHONE)}
                >
                    Забыли пароль?
                </span>
                <Popup
                    className="password-recovery__modal"
                    open={recoveryState !== RecoveryState.IDLE}
                    onClose={() => setRecoveryState(RecoveryState.IDLE)}
                >
                    <button
                        className="password-recovery__close"
                        onClick={() => setRecoveryState(RecoveryState.IDLE)}
                    >
                        ×
                    </button>
                    <h2 className="password-recovery__title">
                        Восстановление пароля
                    </h2>
                    <p className="password-recovery__info">
                        Введите номер телефона, после чего на почту, привязанную к вашему аккаунту придёт письмо подтверждения.
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
                                placeholder="Введите код с почты"
                                onChange={(e) => setRecoveryCode(e.target.value)}
                                value={recoveryCode}
                            />
                            <input
                                className="password-recovery-form__input password-recovery-form__input--extended"
                                placeholder="Новый пароль"
                                onChange={(e) => setRecoveryPassword(e.target.value)}
                                value={recoveryPassword}
                            />
                            <button className="password-recovery-form__button">
                                Отправить
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

                            <div className="input_phone_wrap_recovery">
                                <PhoneInput
                                    className={`password-recovery-form__input ${recoveryPhone.length > 4 ? 'phone_input_accent' : 'phone_input_lite'}`}
                                    name="recovery-phone"
                                    value={recoveryPhone}
                                    onChange={(nextValue) => setRecoveryPhone(nextValue)}
                                    onValidationError={(message) => setRecoveryError(message)}
                                    required
                                />
                            </div>
                            <button className="password-recovery-form__button">
                                Отправить
                            </button>
                            
                        </form>
                    )}
                </Popup>
            </form>
        </section>
    )
}


export default Login;
