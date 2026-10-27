import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Agendar from '../pages/hogar/Agendar.jsx';
import { apiMock } from './mocks.js';

vi.mock('../api/client.js', async () => (await import('./mocks.js')).mockApiModule());

const CATEGORIAS = [
  { id: 1, nombre: 'Aprovechables', color_bolsa: 'blanca' },
  { id: 2, nombre: 'Orgánicos', color_bolsa: 'verde' },
];

describe('Wizard de agendamiento (RF-12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockResolvedValue(CATEGORIAS);
    apiMock.post.mockResolvedValue({ id: 10, estado: 'pendiente' });
  });

  function renderAgendar() {
    return render(
      <MemoryRouter>
        <Agendar />
      </MemoryRouter>,
    );
  }

  it('completes the 3 steps: materials → availability → confirm', async () => {
    const user = userEvent.setup();
    renderAgendar();

    // Step 1: materials + bag size (understandable units)
    expect(await screen.findByText(/¿Qué materiales entregarás\?/)).toBeInTheDocument();
    expect(screen.getByText(/Pequeña \(~2 kg\)/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Tipo de material/), '1');
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    // Step 2: date + time slot
    expect(await screen.findByText(/¿Cuándo puedes entregar\?/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Fecha$/), { target: { value: '2030-05-10' } });
    await user.type(screen.getByLabelText(/Nota de acceso/), 'dejar en portería');
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    // Step 3: summary + confirm
    expect(await screen.findByText(/Confirma tu solicitud/)).toBeInTheDocument();
    expect(screen.getByText(/aprovechables/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Confirmar solicitud/ }));

    expect(await screen.findByText(/¡Solicitud creada!/)).toBeInTheDocument();
    expect(apiMock.post).toHaveBeenCalledWith(
      '/solicitudes',
      expect.objectContaining({
        fecha_solicitada: '2030-05-10',
        nota_acceso: 'dejar en portería',
        detalles: [{ categoria_id: 1, tamano_bolsa: 'mediana', cantidad: 1 }],
      }),
    );
  });

  it('does not advance from step 1 without selecting a material', async () => {
    const user = userEvent.setup();
    renderAgendar();

    await screen.findByText(/¿Qué materiales entregarás\?/);
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Selecciona la categoría de cada material.',
    );
    expect(screen.getByText(/¿Qué materiales entregarás\?/)).toBeInTheDocument();
  });
});
