import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cityName } from '../utils/cities';
import { formatDate, formatDateShort, formatDuration, formatINR, formatTime } from '../utils/format';
import { hotelService } from '../services/hotelService';
import { bookingService } from '../services/bookingService';
import { ApiError } from '../services/api';
import { Banner, EmptyState, Spinner } from '../components/States';
import Stars from '../components/Stars';

const phoneRe = /^(\+91[\s-]?)?[6-9]\d{9}$/;

function formatCardNumber(raw) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function Checkout() {
  const { user } = useAuth();
  const [params] = useSearchParams();

  const type = params.get('type');

  // ── Extract booking draft from the URL ──────────────────────────────────
  const draft = useMemo(() => {
    if (type === 'hotel') {
      return {
        hotelId: Number(params.get('hotelId')) || null,
        checkIn: params.get('checkIn') || '',
        checkOut: params.get('checkOut') || '',
        guests: Number(params.get('guests')) || 2,
        rooms: Number(params.get('rooms')) || 1,
      };
    }
    if (type === 'flight') {
      return {
        from: params.get('from') || '',
        to: params.get('to') || '',
        date: params.get('date') || '',
        adults: Number(params.get('adults')) || 1,
        offerId: params.get('offerId') || '',
        airline: params.get('airline') || '',
        flightNumber: params.get('flightNumber') || '',
        departTime: params.get('departTime') || '',
        arriveTime: params.get('arriveTime') || '',
        durationMins: Number(params.get('durationMins')) || 0,
        stops: Number(params.get('stops')) || 0,
        cabinClass: params.get('cabinClass') || 'ECONOMY',
        price: Number(params.get('price')) || 0,
      };
    }
    return null;
  }, [params, type]);

  // ── State ────────────────────────────────────────────────────────────────
  const [hotel, setHotel] = useState(null);
  const [hotelStatus, setHotelStatus] = useState(type === 'hotel' ? 'loading' : 'not-needed');
  const [step, setStep] = useState('details'); // details | payment | processing | done
  const [booking, setBooking] = useState(null);
  const [bookingError, setBookingError] = useState('');

  const [traveller, setTraveller] = useState({
    guestName: user?.name ?? '',
    guestEmail: user?.email ?? '',
    guestPhone: '',
  });
  const [travellerErrors, setTravellerErrors] = useState({});

  const [payment, setPayment] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
  const [paymentErrors, setPaymentErrors] = useState({});

  // Fetch authoritative hotel data when checking out a stay.
  useEffect(() => {
    if (type !== 'hotel' || !draft?.hotelId) return;
    const controller = new AbortController();
    setHotelStatus('loading');
    hotelService
      .get(draft.hotelId, controller.signal)
      .then((data) => {
        setHotel(data.hotel);
        setHotelStatus('ready');
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setHotelStatus('error');
      });
    return () => controller.abort();
  }, [type, draft?.hotelId]);

  const nights =
    type === 'hotel' && draft?.checkIn && draft?.checkOut
      ? Math.max(
          0,
          Math.round((new Date(`${draft.checkOut}T00:00:00`) - new Date(`${draft.checkIn}T00:00:00`)) / 86400000)
        )
      : 0;

  const totals = useMemo(() => {
    if (type === 'hotel' && hotel) {
      const subtotal = hotel.price_per_night * nights * draft.rooms;
      return { lines: [[`${formatINR(hotel.price_per_night)} × ${nights} night${nights !== 1 ? 's' : ''} × ${draft.rooms} room${draft.rooms !== 1 ? 's' : ''}`, subtotal]], total: subtotal };
    }
    if (type === 'flight' && draft?.price) {
      const subtotal = draft.price * draft.adults;
      return {
        lines: [
          [`${formatINR(draft.price)} × ${draft.adults} adult${draft.adults !== 1 ? 's' : ''}`, subtotal],
        ],
        total: subtotal,
      };
    }
    return null;
  }, [type, hotel, draft, nights]);

  // ── Guards ───────────────────────────────────────────────────────────────
  if (!type || !draft || (type === 'hotel' && !draft.hotelId) || (type === 'flight' && !draft.price)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon="🛒"
          title="Nothing to check out"
          subtitle="Start from a hotel or a flight search and we'll bring you here."
        >
          <Link to="/hotels" className="btn-primary">Search hotels</Link>
          <Link to="/flights" className="btn-secondary">Search flights</Link>
        </EmptyState>
      </div>
    );
  }

  // ── Validation ───────────────────────────────────────────────────────────
  const validateTraveller = () => {
    const errors = {};
    if (!traveller.guestName.trim() || traveller.guestName.trim().length < 2)
      errors.guestName = 'Full name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(traveller.guestEmail.trim()))
      errors.guestEmail = 'Enter a valid email address';
    if (!phoneRe.test(traveller.guestPhone.trim()))
      errors.guestPhone = 'Enter a valid Indian mobile number (e.g. 98765 43210)';
    setTravellerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = () => {
    const errors = {};
    if (!payment.cardName.trim()) errors.cardName = 'Name on card is required';
    if (payment.cardNumber.replace(/\s/g, '').length !== 16)
      errors.cardNumber = 'Card number must be 16 digits';
    const [mm, yy] = payment.expiry.split('/');
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry) || Number(mm) < 1 || Number(mm) > 12)
      errors.expiry = 'Expiry must be MM/YY';
    if (!/^\d{3,4}$/.test(payment.cvv)) errors.cvv = 'CVV must be 3 or 4 digits';
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Mock pay → create booking ────────────────────────────────────────────
  const pay = async () => {
    if (!validatePayment()) return;
    setStep('processing');
    setBookingError('');
    try {
      await new Promise((r) => setTimeout(r, 1200)); // simulated payment gateway
      const details =
        type === 'hotel'
          ? { ...draft, ...traveller }
          : { ...draft, ...traveller };
      const data = await bookingService.create({ type, details });
      setBooking(data.booking);
      setStep('done');
    } catch (err) {
      setBookingError(err instanceof ApiError ? err.message : 'Booking failed — please try again.');
      setStep('payment');
    }
  };

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (step === 'done' && booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="card animate-fade-in p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl" aria-hidden="true">
            ✓
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-stone-800">Booking confirmed!</h1>
          <p className="mt-1 text-sm text-stone-500">
            A confirmation would normally be emailed to {traveller.guestEmail}. This demo stores it in your
            Wanderly dashboard.
          </p>
          <p className="mt-6 text-xs uppercase tracking-wide text-stone-400">Booking reference</p>
          <p className="font-mono text-3xl font-extrabold tracking-wider text-teal-700">{booking.ref}</p>
          <dl className="mt-6 space-y-2 border-t border-stone-100 pt-5 text-left text-sm">
            {type === 'hotel' ? (
              <>
                <div className="flex justify-between"><dt className="text-stone-500">Hotel</dt><dd className="font-medium">{hotel?.name ?? booking.details.hotelName}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-500">Dates</dt><dd className="font-medium">{formatDate(booking.details.checkIn)} → {formatDate(booking.details.checkOut)}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-500">Guests / rooms</dt><dd className="font-medium">{booking.details.guests} / {booking.details.rooms}</dd></div>
              </>
            ) : (
              <>
                <div className="flex justify-between"><dt className="text-stone-500">Flight</dt><dd className="font-medium">{booking.details.airline} {booking.details.flightNumber}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-500">Route</dt><dd className="font-medium">{booking.details.from} → {booking.details.to}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-500">Departure</dt><dd className="font-medium">{formatDate(booking.details.date)} · {formatTime(booking.details.departTime)}</dd></div>
              </>
            )}
            <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-bold"><dt>Total paid</dt><dd>{formatINR(booking.total_amount)}</dd></div>
          </dl>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/my-trips" className="btn-primary">View my trips</Link>
            <Link to="/hotels" className="btn-secondary">Book another</Link>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'hotel' && hotelStatus !== 'ready') {
    if (hotelStatus === 'error') {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState icon="⚠️" title="Could not load the hotel details" subtitle="Go back and try reserving again.">
            <Link to="/hotels" className="btn-primary">Back to hotels</Link>
          </EmptyState>
        </div>
      );
    }
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Preparing checkout">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  // ── Checkout form ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-stone-800">Checkout</h1>
      <p className="mt-1 text-sm text-stone-500">
        {type === 'hotel' ? 'You are booking a stay.' : 'You are booking a flight.'} Payment is simulated — nothing is charged.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Step indicator */}
          <ol className="flex items-center gap-2 text-sm" aria-label="Checkout progress">
            {['Traveller details', 'Payment'].map((label, i) => {
              const active = (step === 'details' && i === 0) || (step !== 'details' && i === 1);
              const done = step !== 'details' && i === 0;
              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      done ? 'bg-teal-600 text-white' : active ? 'bg-teal-100 text-teal-700' : 'bg-stone-100 text-stone-400'
                    }`}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={active || done ? 'font-semibold text-stone-700' : 'text-stone-400'}>{label}</span>
                  {i === 0 && <span className="mx-1 h-px w-6 bg-stone-300" aria-hidden="true" />}
                </li>
              );
            })}
          </ol>

          {bookingError && <Banner kind="error">{bookingError}</Banner>}

          {step === 'details' && (
            <section className="card p-6" aria-label="Traveller details">
              <h2 className="font-bold text-stone-800">Traveller details</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="guestName" className="label">Full name</label>
                  <input
                    id="guestName"
                    className={`input ${travellerErrors.guestName ? 'input-error' : ''}`}
                    value={traveller.guestName}
                    onChange={(e) => setTraveller((t) => ({ ...t, guestName: e.target.value }))}
                    aria-invalid={Boolean(travellerErrors.guestName)}
                  />
                  {travellerErrors.guestName && <p className="field-error" role="alert">{travellerErrors.guestName}</p>}
                </div>
                <div>
                  <label htmlFor="guestEmail" className="label">Email</label>
                  <input
                    id="guestEmail"
                    type="email"
                    className={`input ${travellerErrors.guestEmail ? 'input-error' : ''}`}
                    value={traveller.guestEmail}
                    onChange={(e) => setTraveller((t) => ({ ...t, guestEmail: e.target.value }))}
                    aria-invalid={Boolean(travellerErrors.guestEmail)}
                  />
                  {travellerErrors.guestEmail && <p className="field-error" role="alert">{travellerErrors.guestEmail}</p>}
                </div>
                <div>
                  <label htmlFor="guestPhone" className="label">Mobile number</label>
                  <input
                    id="guestPhone"
                    type="tel"
                    placeholder="98765 43210"
                    className={`input ${travellerErrors.guestPhone ? 'input-error' : ''}`}
                    value={traveller.guestPhone}
                    onChange={(e) => setTraveller((t) => ({ ...t, guestPhone: e.target.value }))}
                    aria-invalid={Boolean(travellerErrors.guestPhone)}
                  />
                  {travellerErrors.guestPhone && <p className="field-error" role="alert">{travellerErrors.guestPhone}</p>}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => validateTraveller() && setStep('payment')}
                >
                  Continue to payment
                </button>
              </div>
            </section>
          )}

          {step === 'payment' && (
            <section className="card p-6" aria-label="Payment details">
              <h2 className="font-bold text-stone-800">Payment</h2>
              <p className="mt-1 text-xs text-stone-400">
                Demo checkout — enter any 16 digits (e.g. 4111 1111 1111 1111). No real charge is made.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="cardName" className="label">Name on card</label>
                  <input
                    id="cardName"
                    className={`input ${paymentErrors.cardName ? 'input-error' : ''}`}
                    value={payment.cardName}
                    onChange={(e) => setPayment((p) => ({ ...p, cardName: e.target.value }))}
                    aria-invalid={Boolean(paymentErrors.cardName)}
                  />
                  {paymentErrors.cardName && <p className="field-error" role="alert">{paymentErrors.cardName}</p>}
                </div>
                <div>
                  <label htmlFor="cardNumber" className="label">Card number</label>
                  <input
                    id="cardNumber"
                    inputMode="numeric"
                    placeholder="4111 1111 1111 1111"
                    className={`input font-mono ${paymentErrors.cardNumber ? 'input-error' : ''}`}
                    value={payment.cardNumber}
                    onChange={(e) => setPayment((p) => ({ ...p, cardNumber: formatCardNumber(e.target.value) }))}
                    aria-invalid={Boolean(paymentErrors.cardNumber)}
                  />
                  {paymentErrors.cardNumber && <p className="field-error" role="alert">{paymentErrors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="expiry" className="label">Expiry (MM/YY)</label>
                    <input
                      id="expiry"
                      inputMode="numeric"
                      placeholder="12/28"
                      className={`input font-mono ${paymentErrors.expiry ? 'input-error' : ''}`}
                      value={payment.expiry}
                      onChange={(e) => setPayment((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                      aria-invalid={Boolean(paymentErrors.expiry)}
                    />
                    {paymentErrors.expiry && <p className="field-error" role="alert">{paymentErrors.expiry}</p>}
                  </div>
                  <div>
                    <label htmlFor="cvv" className="label">CVV</label>
                    <input
                      id="cvv"
                      inputMode="numeric"
                      placeholder="123"
                      maxLength={4}
                      className={`input font-mono ${paymentErrors.cvv ? 'input-error' : ''}`}
                      value={payment.cvv}
                      onChange={(e) => setPayment((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      aria-invalid={Boolean(paymentErrors.cvv)}
                    />
                    {paymentErrors.cvv && <p className="field-error" role="alert">{paymentErrors.cvv}</p>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" className="btn-secondary" onClick={() => setStep('details')}>
                    Back
                  </button>
                  <button type="button" className="btn-primary flex-1" onClick={pay} disabled={step === 'processing'}>
                    {step === 'processing' ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner className="h-4 w-4" /> Processing payment…
                      </span>
                    ) : (
                      `Pay ${formatINR(totals?.total ?? 0)}`
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Price summary */}
        <aside>
          <div className="card sticky top-24 p-6">
            <h2 className="font-bold text-stone-800">Price summary</h2>
            {type === 'hotel' && hotel && (
              <div className="mt-4 flex gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-800">{hotel.name}</p>
                  <p className="text-xs text-stone-500">{cityName(hotel.city_code)}</p>
                  <Stars count={hotel.stars} className="mt-1 text-sm" />
                  <p className="mt-2 text-xs text-stone-500">
                    {formatDateShort(draft.checkIn)} → {formatDateShort(draft.checkOut)} · {draft.guests} guest{draft.guests !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
            {type === 'flight' && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-stone-800">
                  {draft.airline} {draft.flightNumber}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {draft.from} → {draft.to} · {formatDate(draft.date)}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {formatTime(draft.departTime)} – {formatTime(draft.arriveTime)} · {formatDuration(draft.durationMins)} ·{' '}
                  {draft.stops === 0 ? 'Nonstop' : `${draft.stops} stop${draft.stops > 1 ? 's' : ''}`}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  {draft.adults} adult{draft.adults !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            {totals && (
              <dl className="mt-5 space-y-2 border-t border-stone-100 pt-4 text-sm">
                {totals.lines.map(([label, amount]) => (
                  <div key={label} className="flex justify-between gap-3 text-stone-600">
                    <dt>{label}</dt>
                    <dd className="font-medium text-stone-800">{formatINR(amount)}</dd>
                  </div>
                ))}
                <div className="flex justify-between text-stone-600">
                  <dt>Taxes & fees</dt>
                  <dd className="font-medium text-teal-700">Included</dd>
                </div>
                <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-bold text-stone-900">
                  <dt>Total</dt>
                  <dd>{formatINR(totals.total)}</dd>
                </div>
              </dl>
            )}
            <p className="mt-4 text-xs text-stone-400">
              🔒 Transparent pricing — the price you see is the price you pay.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
