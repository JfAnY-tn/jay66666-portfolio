import { useState, useRef, useEffect } from 'react';
import { validateName, validateEmail, validateSubject, validateMessage } from '../../utils/validation';
import Button from './Button';

const initialState = { name: '', email: '', subject: '', message: '' };

export default function ContactForm() {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success
  const nameRef = useRef(null);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setValues(initialState);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const fieldErrors = {
      name: validateName(values.name),
      email: validateEmail(values.email),
      subject: validateSubject(values.subject),
      message: validateMessage(values.message),
    };

    const hasError = Object.values(fieldErrors).some(Boolean);
    setErrors(fieldErrors);

    if (hasError) {
      const firstError = Object.keys(fieldErrors).find((k) => fieldErrors[k]);
      const el = document.getElementById(`field-${firstError}`);
      el?.focus();
      return;
    }

    setStatus('submitting');

    setTimeout(() => {
      console.log('表单提交:', {
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject.trim(),
        message: values.message.trim(),
        submittedAt: new Date().toISOString(),
      });
      setStatus('success');
    }, 600);
  };

  const fieldClass = (name) =>
    `w-full rounded-xl border bg-white dark:bg-cinema-dark/50 px-4 py-3 text-sm text-gray-800 dark:text-cinema-text placeholder:text-gray-400 dark:placeholder:text-cinema-text-muted/50 focus:outline-none focus:ring-2 focus:ring-vivid-purple-500/50 transition-colors ${
      errors[name] ? 'border-hot-pink-500' : 'border-gray-200 dark:border-cinema-surface hover:border-gray-300 dark:hover:border-cinema-surface-hover'
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="field-name" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">
          姓名 <span className="text-hot-pink-500">*</span>
        </label>
        <input
          ref={nameRef}
          id="field-name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          placeholder="你的名字"
          className={fieldClass('name')}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-hot-pink-500">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="field-email" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">
          邮箱 <span className="text-hot-pink-500">*</span>
        </label>
        <input
          id="field-email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className={fieldClass('email')}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-hot-pink-500">{errors.email}</p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="field-subject" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">
          主题 <span className="text-hot-pink-500">*</span>
        </label>
        <input
          id="field-subject"
          name="subject"
          type="text"
          value={values.subject}
          onChange={handleChange}
          placeholder="项目类型"
          className={fieldClass('subject')}
        />
        {errors.subject && (
          <p className="mt-1 text-xs text-hot-pink-500">{errors.subject}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="field-message" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-cinema-text">
          留言内容 <span className="text-hot-pink-500">*</span>
        </label>
        <textarea
          id="field-message"
          name="message"
          rows={4}
          value={values.message}
          onChange={handleChange}
          placeholder="请描述你的项目需求、预算和时间要求..."
          className={`${fieldClass('message')} resize-none`}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-hot-pink-500">{errors.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? '发送中...' : '发送留言'}
      </Button>

      {/* Success */}
      {status === 'success' && (
        <div className="rounded-xl bg-electric-teal-500/10 border border-electric-teal-500/30 p-4 text-center text-sm text-electric-teal-400">
          感谢留言！我会尽快回复您。
        </div>
      )}
    </form>
  );
}
