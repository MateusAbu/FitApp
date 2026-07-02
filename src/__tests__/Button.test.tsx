import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../shared/components/Button';
import { ThemeProvider } from '../providers/ThemeProvider';
import { TouchableOpacity } from 'react-native';

describe('Button Component', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
  };

  it('should render title correctly', () => {
    const { getByText } = renderWithTheme(<Button title="Clique Aqui" />);
    expect(getByText('Clique Aqui')).toBeTruthy();
  });

  it('should trigger onPress when clicked', () => {
    const onPressMock = jest.fn();
    const { getByText } = renderWithTheme(<Button title="Aperte" onPress={onPressMock} />);
    
    fireEvent.press(getByText('Aperte'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading is true', () => {
    const onPressMock = jest.fn();
    const { queryByText, UNSAFE_getByType } = renderWithTheme(
      <Button title="Enviar" loading={true} onPress={onPressMock} />
    );

    // Não deve renderizar o texto principal
    expect(queryByText('Enviar')).toBeNull();

    // O botão deve estar desabilitado
    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button.props.disabled).toBe(true);
  });
});
