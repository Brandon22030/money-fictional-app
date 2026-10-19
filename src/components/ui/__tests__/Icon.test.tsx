import { render, screen } from '@testing-library/react-native';

import { ICON_NAMES, Icon } from '@/src/components/ui/Icon';

describe('Icon', () => {
  it('exposes the 23 mockup icon names', () => {
    expect(ICON_NAMES).toHaveLength(23);
  });

  it.each(ICON_NAMES)('renders %s without error', async (name) => {
    await render(<Icon name={name} testID="icon" />);

    expect(screen.getByTestId('icon', { includeHiddenElements: true })).toBeTruthy();
  });

  it('applies size, color and the default 1.6 stroke', async () => {
    await render(<Icon name="bell" size={20} color="#fff" testID="icon" />);
    const svg = screen.getByTestId('icon', { includeHiddenElements: true });

    expect(svg.props.width).toBe(20);
    expect(svg.props.height).toBe(20);
    expect(svg.props.stroke).toBe('#fff');
    expect(svg.props.strokeWidth).toBe(1.6);
  });

  it('is hidden from accessibility', async () => {
    await render(<Icon name="check" testID="icon" />);

    expect(screen.queryByTestId('icon')).toBeNull();
  });
});
