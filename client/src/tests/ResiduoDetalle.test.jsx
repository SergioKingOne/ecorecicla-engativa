import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResiduoDetalle from '../pages/ResiduoDetalle.jsx';
import { apiMock } from './mocks.js';

vi.mock('../api/client.js', async () => (await import('./mocks.js')).mockApiModule());

const TETRAPAK = {
  id: 1,
  nombre: 'Tetrapak',
  categoria_id: 1,
  categoria: 'Aprovechables',
  color_bolsa: 'blanca',
  preparacion_previa: 'Enjuagar y aplanar. Puedes dejar la tapa puesta.',
  error_frecuente: '4 de cada 5 hogares lo disponen en bolsa negra; enjuagado y aplanado sí es aprovechable.',
  sinonimos: ['caja de leche'],
};

describe('Ficha del residuo (RF-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockResolvedValue(TETRAPAK);
  });

  function renderFicha() {
    return render(
      <MemoryRouter initialEntries={['/residuos/1']}>
        <Routes>
          <Route path="/residuos/:id" element={<ResiduoDetalle />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('shows the bag color WITH text, never color alone (WCAG 1.4.1)', async () => {
    renderFicha();

    expect(await screen.findByText(/BOLSA BLANCA/)).toBeInTheDocument();
    expect(screen.getByText(/— Aprovechables/)).toBeInTheDocument();
  });

  it('shows the preparation and the highlighted frequent error', async () => {
    renderFicha();

    expect(await screen.findByText(TETRAPAK.preparacion_previa)).toBeInTheDocument();
    expect(screen.getByText(TETRAPAK.error_frecuente)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Error frecuente/ })).toBeInTheDocument();
  });

  it('shows an error message when the item does not exist', async () => {
    apiMock.get.mockRejectedValue(new Error('El residuo no existe.'));
    renderFicha();

    expect(await screen.findByRole('alert')).toHaveTextContent('El residuo no existe.');
  });
});
