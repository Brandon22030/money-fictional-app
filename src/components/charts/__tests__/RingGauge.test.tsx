import { render, screen } from '@testing-library/react-native';

import '@/src/i18n';
import { RingGauge, type RingSegment } from '../RingGauge';

const segments: RingSegment[] = [
  {
    key: 'received',
    label: 'Reçu',
    value: 40,
    color: '#1B3F7A',
    icon: 'down',
  },
  { key: 'sent', label: 'Envoyé', value: 30, color: '#0F2A55', icon: 'send' },
  {
    key: 'paid',
    label: 'Payé',
    value: 20,
    color: '#2A5594',
    icon: 'card',
  },
];

describe('RingGauge', () => {
  it('renders one segment, label and badge per kind with the center text', async () => {
    await render(<RingGauge segments={segments} centerLabel="186k" centerCaption="solde en €" />);

    for (const s of segments) {
      expect(screen.getByTestId(`ring-segment-${s.key}`)).toBeTruthy();
      expect(screen.getByTestId(`ring-label-${s.key}`)).toBeTruthy();
      expect(screen.getByTestId(`ring-badge-${s.key}`)).toBeTruthy();
    }
    expect(screen.getByTestId('ring-center')).toBeTruthy();
    expect(screen.getByTestId('ring-caption')).toBeTruthy();
  });

  it('renders straight labels when curved labels are disabled', async () => {
    await render(<RingGauge segments={segments} centerLabel="1M" curvedLabels={false} />);

    expect(screen.getByTestId('ring-label-received')).toBeTruthy();
  });

  it('shows a neutral ring without crashing on empty data', async () => {
    await render(<RingGauge segments={[]} centerLabel="0" />);

    expect(screen.getByTestId('ring-track')).toBeTruthy();
    expect(screen.queryByTestId('ring-segment-received')).toBeNull();
    expect(screen.getByTestId('ring-center')).toBeTruthy();
  });

  it('ignores segments with a zero value', async () => {
    await render(
      <RingGauge
        segments={[
          ...segments,
          {
            key: 'out',
            label: 'Retiré',
            value: 0,
            color: '#163766',
            icon: 'up',
          },
        ]}
        centerLabel="1k"
      />,
    );

    expect(screen.queryByTestId('ring-segment-out')).toBeNull();
  });
});
