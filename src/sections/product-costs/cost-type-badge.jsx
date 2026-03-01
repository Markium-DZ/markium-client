import PropTypes from 'prop-types';

import Iconify from 'src/components/iconify';
import Label from 'src/components/label';
import { useTranslate } from 'src/locales';

import { getCostTypeConfig } from './constants';

export default function CostTypeBadge({ type, customTypeName }) {
  const { t } = useTranslate();
  const config = getCostTypeConfig(type);
  const label = type === 'custom' && customTypeName ? customTypeName : t(config.labelKey);

  return (
    <Label
      variant="soft"
      color={config.color}
      startIcon={<Iconify icon={config.icon} width={16} />}
    >
      {label}
    </Label>
  );
}

CostTypeBadge.propTypes = {
  type: PropTypes.string.isRequired,
  customTypeName: PropTypes.string,
};
