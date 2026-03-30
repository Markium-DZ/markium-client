import PropTypes from 'prop-types';
import { cloneElement, useState, useCallback } from 'react';

import { useAuthContext } from 'src/auth/hooks';
import { OtpVerifyModal } from 'src/sections/auth/jwt';

// ----------------------------------------------------------------------

export default function VerificationGate({ children }) {
  const { user, refreshUser } = useAuthContext();

  const [otpOpen, setOtpOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const handleClick = useCallback(
    (originalOnClick) => (event) => {
      if (user?.is_phone_verified) {
        originalOnClick?.(event);
        return;
      }

      // Store the original action to execute after verification
      setPendingAction(() => () => originalOnClick?.(event));
      setOtpOpen(true);
    },
    [user?.is_phone_verified]
  );

  const handleOtpClose = useCallback(() => {
    setOtpOpen(false);
    setPendingAction(null);
  }, []);

  // If user is verified, render children as-is
  if (user?.is_phone_verified) {
    return children;
  }

  // Clone child and intercept its onClick
  const child = cloneElement(children, {
    onClick: handleClick(children.props.onClick),
  });

  return (
    <>
      {child}

      <OtpVerifyModal
        open={otpOpen}
        onClose={handleOtpClose}
        showValueProp
      />
    </>
  );
}

VerificationGate.propTypes = {
  children: PropTypes.element.isRequired,
};
