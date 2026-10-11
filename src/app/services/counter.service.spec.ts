import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedCounter } from '../models/saved-counter';
import { CounterService } from './counter.service';
import { key } from 'ionicons/icons';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('CounterService', () => {
  let service: CounterService;

  const getMock = vi.mocked(Preferences.get);
  const setMock = vi.mocked(Preferences.set);
  const removeMock = vi.mocked(Preferences.remove);

  const first: SavedCounter = {
    id: 'first',
    name: 'První',
    value: 1,
    createdAt: '2026-09-17T08:00:00.000Z',
  };

  const second: SavedCounter = {
    id: 'second',
    name: 'Druhé',
    value: 2,
    createdAt: '2026-09-17T09:00:00.000Z',
  };

  beforeEach(() => {
    // Vynulujeme počty volání mocků z předchozího testu.
    vi.clearAllMocks();

    // Výchozí stav: v Preferences zatím není uložená historie.
    getMock.mockResolvedValue({ value: null });

    // Zápis i odstranění ve výchozím stavu úspěšně skončí.
    setMock.mockResolvedValue(undefined);
    removeMock.mockResolvedValue(undefined);

    // Pro každý test vytvoříme nové prostředí Angular dependency injection.
    TestBed.configureTestingModule({
      providers: [CounterService],
    });

    // Z testovacího injectoru získáme čerstvou instanci služby.
    service = TestBed.inject(CounterService);
  });

  it('should initialize only once', async () => {
    // Dvě volání bez čekání simulují souběžné požadavky na inicializaci.
    await Promise.all([service.initialize(), service.initialize()]);

    // Další volání proběhne až po dokončení první inicializace.
    await service.initialize();

    // Všechna volání musí sdílet jedinou operaci načtení Preferences.
    expect(getMock).toHaveBeenCalledTimes(1);

    // Služba dokončila inicializaci a při value: null má prázdnou historii.
    expect(service.initialized()).toBe(true);
    expect(service.counters()).toEqual([]);
  });

  it('should load counters from Preferences', async () => {
    getMock.mockResolvedValue({
    value: JSON.stringify([first, second]),
  });

  await service.initialize();

  expect(service.counters()).toEqual([first, second]);
  expect(service.initialized()).toBe(true);
  expect(getMock).toHaveBeenCalledWith({
    key: 'saved-counters',
  });
});

  it('should add a counter at the beginning', async () => {
    getMock.mockResolvedValue({
      value: JSON.stringify([second]),
    });

    await service.add(first);

    expect(service.counters()).toEqual([first, second]);

    expect(setMock).toHaveBeenCalledWith({
      key: 'saved-counters',
      value: JSON.stringify([first, second]),
    });
  });

it('should remove only the counter with the specified id and persist the result', async () => {
  getMock.mockResolvedValue({
    value: JSON.stringify([first, second]),
  });

  await service.remove('first');

  expect(service.counters()).toEqual([second]);

  expect(setMock).toHaveBeenCalledWith({
    key: 'saved-counters',
    value: JSON.stringify([second]),
  });
});

it('should clear history and remove only the saved-counters key', async () => {
  getMock.mockResolvedValue({
    value: JSON.stringify([first, second]),
  });

  await service.clear();

  expect(service.counters()).toEqual([]);

  expect(removeMock).toHaveBeenCalledTimes(1);
  expect(removeMock).toHaveBeenCalledWith({
    key: 'saved-counters',
  });

  expect(setMock).not.toHaveBeenCalled();
});

it('should handle invalid JSON and log an error', async () => {
  const consoleError = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});

    try {
      getMock.mockResolvedValue({
        value: 'this is not valid JSON',
      });

      await service.initialize();

      expect(service.counters()).toEqual([]);
      expect(service.initialized()).toBe(true);

      expect(consoleError).toHaveBeenCalledWith(
        'Historii počítadel se nepodařilo načíst.',
        expect.any(SyntaxError),
      );
    }
    finally {
      consoleError.mockRestore();
    }
});

});

