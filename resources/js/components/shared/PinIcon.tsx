import PinIconSvg from '@public/icons/small/pin.svg';

interface Props {
  filled: boolean;
}

const PinIcon = ({ filled }: Props) => (
  <PinIconSvg
    fill={filled ? 'currentColor' : 'none'}
    className={filled ? 'text-accent-yellow' : 'text-dark-secondary'}
  />
);

export default PinIcon;
