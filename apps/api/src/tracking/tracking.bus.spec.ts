import { firstValueFrom, take, toArray } from 'rxjs';

import { TrackingBus, TrackingUpdate } from './tracking.bus';

const update = (appointmentId: string, status: TrackingUpdate['status']): TrackingUpdate => ({
  appointmentId,
  code: 'AS-7K3F9Q',
  status,
  message: 'mensaje',
  at: new Date().toISOString(),
});

describe('TrackingBus', () => {
  it('entrega solo las actualizaciones de la cita suscrita', async () => {
    const bus = new TrackingBus();
    const received = firstValueFrom(bus.streamFor('a1').pipe(take(2), toArray()));

    bus.publish(update('a2', 'CONFIRMADA'));
    bus.publish(update('a1', 'CONFIRMADA'));
    bus.publish(update('a2', 'EN_PROCESO'));
    bus.publish(update('a1', 'EN_PROCESO'));

    await expect(received).resolves.toEqual([
      expect.objectContaining({ appointmentId: 'a1', status: 'CONFIRMADA' }),
      expect.objectContaining({ appointmentId: 'a1', status: 'EN_PROCESO' }),
    ]);
  });

  it('no reenvía eventos anteriores a la suscripción', async () => {
    const bus = new TrackingBus();
    bus.publish(update('a1', 'CONFIRMADA'));

    const received = firstValueFrom(bus.streamFor('a1').pipe(take(1), toArray()));
    bus.publish(update('a1', 'EN_PROCESO'));

    await expect(received).resolves.toEqual([expect.objectContaining({ status: 'EN_PROCESO' })]);
  });
});
