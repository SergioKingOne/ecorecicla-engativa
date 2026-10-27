import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SearchBox from '../components/SearchBox.jsx';
import { apiMock } from './mocks.js';

vi.mock('../api/client.js', async () => (await import('./mocks.js')).mockApiModule());

describe('SearchBox (RF-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockResolvedValue({
      resultados: [
        { id: 1, nombre: 'Tetrapak', color_bolsa: 'blanca' },
        { id: 2, nombre: 'Tetrapak pequeño', color_bolsa: 'blanca' },
      ],
      sugerencia: null,
    });
  });

  function renderSearchBox() {
    return render(
      <MemoryRouter>
        <SearchBox />
      </MemoryRouter>,
    );
  }

  it('does NOT query the API with fewer than 3 characters', async () => {
    const user = userEvent.setup();
    renderSearchBox();

    await user.type(screen.getByRole('searchbox'), 'te');
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(apiMock.get).not.toHaveBeenCalled();
    expect(screen.queryByText('Tetrapak')).not.toBeInTheDocument();
  });

  it('shows autocomplete suggestions from 3 characters', async () => {
    const user = userEvent.setup();
    renderSearchBox();

    await user.type(screen.getByRole('searchbox'), 'tet');

    expect(await screen.findByText('Tetrapak')).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith(expect.stringContaining('buscar=tet'));
  });

  it('shows the bag color as text next to each suggestion (WCAG 1.4.1)', async () => {
    const user = userEvent.setup();
    renderSearchBox();

    await user.type(screen.getByRole('searchbox'), 'tetrapak');

    const badges = await screen.findAllByText(/BOLSA BLANCA/);
    expect(badges.length).toBeGreaterThan(0);
  });
});
