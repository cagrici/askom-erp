import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface AlertSuccessProps {
  message: string;
  autoClose?: boolean;
  duration?: number;
}

const AlertSuccess: React.FC<AlertSuccessProps> = ({
  message,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && message) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, message]);

  if (!isVisible || !message) {
    return null;
  }

  return (
    <div className="alert alert-success alert-dismissible fade show" role="alert">
      <div className="d-flex align-items-center">
        <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
        <div>
          {message}
        </div>
      </div>
      <button
        type="button"
        className="btn-close"
        onClick={() => setIsVisible(false)}
        aria-label="Close"
      ></button>
    </div>
  );
};

export default AlertSuccess;
