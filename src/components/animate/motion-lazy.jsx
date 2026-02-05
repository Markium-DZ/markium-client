import PropTypes from 'prop-types';
import { m, LazyMotion } from 'framer-motion';

// Lazy-load the full feature set — keeps framer-motion out of the initial bundle
const loadFeatures = () => import('framer-motion').then((mod) => mod.domMax);

// ----------------------------------------------------------------------

export function MotionLazy({ children }) {
  return (
    <LazyMotion strict features={loadFeatures}>
      <m.div style={{ height: '100%' }}> {children} </m.div>
    </LazyMotion>
  );
}

MotionLazy.propTypes = {
  children: PropTypes.node,
};
