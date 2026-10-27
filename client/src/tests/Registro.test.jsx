import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Registro from '../pages/Registro.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { apiMock } from './mocks.js';

vi.mock('../api/client.js', async () => (await import('./mocks.js')).mockApiModule());

describe('Registro con autorización de datos (RF-18, Ley 1581)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockResolvedValue([]); // /upz
  });

  function renderRegistro() {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <Registro />
        </AuthProvider>
      </MemoryRouter>,
    );
  }

  it('shows the privacy notice with the revocation right', () => {
    renderRegistro();

    expect(screen.getByText(/Aviso de privacidad \(Ley 1581 de 2012\)/)).toBeInTheDocument();
    expect(screen.getByText(/revocar esta autorización en cualquier momento/)).toBeInTheDocument();
  });

  it('blocks the submit button until the consent checkbox is checked', async () => {
    const user = userEvent.setup();
    renderRegistro();

    const submit = screen.getByRole('button', { name: /Crear cuenta/ });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /Autorizo de forma expresa/ }));
    expect(submit).toBeEnabled();

    await user.click(screen.getByRole('checkbox', { name: /Autorizo de forma expresa/ }));
    expect(submit).toBeDisabled();
  });

  it('sends the signup with autorizacion_datos=true when consent is given', async () => {
    const user = userEvent.setup();
    apiMock.post.mockResolvedValue({ usuario: { rol: 'hogar' }, token: 'jwt' });
    renderRegistro();

    await user.type(screen.getByLabelText(/^Nombre$/), 'Hogar de Prueba');
    await user.type(screen.getByLabelText(/Correo electrónico/), 'prueba@test.co');
    await user.type(screen.getByLabelText(/Contraseña/), 'ClaveSegura1!');
    await user.click(screen.getByRole('checkbox', { name: /Autorizo de forma expresa/ }));
    await user.click(screen.getByRole('button', { name: /Crear cuenta/ }));

    expect(apiMock.post).toHaveBeenCalledWith(
      '/auth/registro',
      expect.objectContaining({ autorizacion_datos: true, email: 'prueba@test.co' }),
    );
  });
});
