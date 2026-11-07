import { useState } from 'react';
import { contactService } from '../services/contactService';
import { ApiError } from '../services/api';
import { Banner } from '../components/States';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [feedback, setFeedback] = useState('');

  const setValue = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim() || values.name.trim().length < 2) next.name = 'Name is required';
    if (!emailRe.test(values.email.trim())) next.email = 'Enter a valid email address';
    if (values.message.trim().length < 10) next.message = 'Tell us a bit more (at least 10 characters)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    setFeedback('');
    try {
      const data = await contactService.send({
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
      });
      setStatus('success');
      setFeedback(data.message);
      setValues({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setFeedback(err instanceof ApiError ? err.message : 'Could not send your message — please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Contact form">
      {status === 'success' && <Banner kind="success">{feedback}</Banner>}
      {status === 'error' && <Banner kind="error">{feedback}</Banner>}

      <div>
        <label htmlFor="contact-name" className="label">Name</label>
        <input
          id="contact-name"
          className={`input ${errors.name ? 'input-error' : ''}`}
          placeholder="Your name"
          value={values.name}
          onChange={(e) => setValue('name', e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
        />
        {errors.name && <p id="contact-name-error" className="field-error" role="alert">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="contact-email" className="label">Email</label>
        <input
          id="contact-email"
          type="email"
          className={`input ${errors.email ? 'input-error' : ''}`}
          placeholder="you@example.com"
          value={values.email}
          onChange={(e) => setValue('email', e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
        />
        {errors.email && <p id="contact-email-error" className="field-error" role="alert">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="contact-message" className="label">Message</label>
        <textarea
          id="contact-message"
          rows={4}
          className={`input resize-y ${errors.message ? 'input-error' : ''}`}
          placeholder="How can we help?"
          value={values.message}
          onChange={(e) => setValue('message', e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
        />
        {errors.message && <p id="contact-message-error" className="field-error" role="alert">{errors.message}</p>}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
