import { useState, type InputHTMLAttributes } from 'react'

// A password field with a show/hide button
export default function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="input-wrap">
      <input {...props} className="input" type={visible ? 'text' : 'password'} dir="ltr" />
      <button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? 'הסתרת סיסמה' : 'הצגת סיסמה'}>
        {visible ? 'הסתרה' : 'הצגה'}
      </button>
    </div>
  )
}
