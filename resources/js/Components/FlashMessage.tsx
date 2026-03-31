import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { usePage } from '@inertiajs/react';

const FlashMessage = () => {
  const { flash } = usePage().props as any;
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');

  useEffect(() => {
    if (flash?.success) {
      setMessage(flash.success);
      setType('success');
      setShow(true);
    } else if (flash?.error) {
      setMessage(flash.error);
      setType('danger');
      setShow(true);
    } else if (flash?.warning) {
      setMessage(flash.warning);
      setType('warning');
      setShow(true);
    } else if (flash?.info) {
      setMessage(flash.info);
      setType('info');
      setShow(true);
    }

    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  if (!show || !message) return null;

  return (
    <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, maxWidth: '400px' }}>
      <Alert variant={type} onClose={() => setShow(false)} dismissible>
        {message}
      </Alert>
    </div>
  );
};

export default FlashMessage;
