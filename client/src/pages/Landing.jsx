import { Link, useNavigate } from 'react-router-dom';
import { CITIES } from '../utils/cities';
import { addDaysISO, todayISO } from '../utils/format';
import SearchBox from '../components/SearchBox';
import ContactForm from '../components/ContactForm';

const CITY_IMAGES = {
  GOA: 'https://images.unsplash.com/photo-1512343879784-a960bf80e782?auto=format&fit=crop&w=900&q=70',
  DEL: 'https://images.unsplash.com/photo-1587134105909-2e1306c3d14f?auto=format&fit=crop&w=900&q=70',
  BOM: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=900&q=70',
  BLR: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=900&q=70',
  JAI: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=70',
  DXB: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=70',
  SIN: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=70',
  BKK: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=70',
};

const FROM_PRICES = { GOA: 1200, DEL: 1300, BOM: 2800, BLR: 2200, JAI: 1400, DXB: 5200, SIN: 2900, BKK: 1100 };

function SectionHeading({ kicker, title, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-teal-600">{kicker}</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-800">{title}</h2>
      {subtitle && <p className="mt-3 text-stone-500">{subtitle}</p>}
    </div>
  );
}

function DestinationCard({ city }) {
  return (
    <Link
      to={`/hotels?city=${city.code}`}
      className="group relative block overflow-hidden rounded-2xl shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
    >
      <img
        src={CITY_IMAGES[city.code]}
        alt={`${city.name}, ${city.country}`}
        loading="lazy"
        className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement.classList.add('bg-gradient-to-br', 'from-teal-600', 'to-emerald-800');
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <p className="text-lg font-bold">{city.name}</p>
        <p className="text-xs text-white/80">{city.tagline}</p>
        <p className="mt-1 text-xs font-semibold text-teal-200">Stays from ₹{FROM_PRICES[city.code].toLocaleString('en-IN')}/night</p>
      </div>
    </Link>
  );
}

const PROBLEMS = [
  {
    icon: '🗂️',
    title: 'Too many tabs and sites',
    body: 'Flights on one site, hotels on another, prices on a third. You spend an evening copy-pasting between ten tabs and still wonder if you missed a better deal.',
  },
  {
    icon: '🙈',
    title: 'Hidden fees at checkout',
    body: 'The price you compared is never the price you pay — "convenience" fees, taxes and charges appear only at the last step, after you\'ve already decided.',
  },
  {
    icon: '📧',
    title: 'Bookings scattered everywhere',
    body: 'Your flight confirmation is in one email, the hotel voucher in another, and nobody can answer "what\'s my trip status?" without a five-minute inbox hunt.',
  },
];

const SOLUTIONS = [
  {
    icon: '🔍',
    title: 'One place for hotels + flights',
    body: 'Search stays and flights side by side in the same interface, book both with one checkout flow — no more tab juggling.',
    matches: 'Solves pain point 1',
  },
  {
    icon: '🏷️',
    title: 'Transparent prices',
    body: 'Taxes included, INR everywhere, the number you see is the number you pay. Our price summary never adds a surprise at the last step.',
    matches: 'Solves pain point 2',
  },
  {
    icon: '🧳',
    title: 'Every trip in one dashboard',
    body: 'My Trips shows all bookings with live status — confirmed or cancelled — and one-click cancellation. Your whole journey, one page.',
    matches: 'Solves pain point 3',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  const scrollTo = (id) => (event) => {
    event.preventDefault();
    if (window.location.pathname !== '/') {
      navigate(`/#${id}`);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section id="home" className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1800&q=70"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/85 via-teal-800/70 to-emerald-900/80" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <p className="badge bg-white/10 text-teal-100 ring-1 ring-white/20">
              ✈️ Hotels + flights · one checkout
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Plan less. <span className="text-teal-300">Travel more.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-teal-50/90">
              Wanderly brings hotels and flights into one place, with transparent INR pricing and
              every trip in a single dashboard. Compare once, book once, go.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="btn-primary !bg-teal-500 !px-6 !py-3 !text-base hover:!bg-teal-400">
                Get started
              </Link>
              <button type="button" onClick={scrollTo('destinations')} className="btn-secondary !border-white/40 !bg-white/10 !px-6 !py-3 !text-base !text-white hover:!border-white hover:!text-white">
                Search trips
              </button>
            </div>
          </div>
          <div className="mt-10 max-w-3xl">
            <SearchBox
              onSearch={(query) => {
                const q = new URLSearchParams({ city: query.city, checkIn: query.checkIn, checkOut: query.checkOut });
                navigate(`/hotels?${q.toString()}`);
              }}
            />
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section id="about" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-teal-600">About Wanderly</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-800">
              One account. Every trip.
            </h2>
            <p className="mt-4 leading-relaxed text-stone-600">
              Wanderly is a travel booking platform for people who just want to go: weekend
              explorers, backpackers, families and business travellers. We put 48 hand-picked
              stays across 8 cities and flight search into a single, fast interface.
            </p>
            <p className="mt-3 leading-relaxed text-stone-600">
              No juggling tabs. No fee surprises. Every booking lands in one dashboard where you
              can track it or cancel it in a click.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Weekend travellers', 'Backpackers', 'Families', 'Business trips'].map((t) => (
                <span key={t} className="chip !bg-teal-50 !text-teal-700">{t}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: '8', label: 'cities covered' },
              { n: '48+', label: 'curated stays' },
              { n: '1', label: 'checkout for everything' },
              { n: '₹0', label: 'hidden fees, ever' },
            ].map((s) => (
              <div key={s.label} className="card p-6 text-center">
                <p className="text-3xl font-extrabold text-teal-600">{s.n}</p>
                <p className="mt-1 text-sm text-stone-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────────────────── */}
      <section id="problem" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            kicker="The problem"
            title="Booking a trip is needlessly painful"
            subtitle="Three things almost every traveller complains about — and that most booking sites ignore."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <div key={p.title} className="card relative p-6">
                <span className="absolute right-5 top-5 text-xs font-bold text-stone-300" aria-hidden="true">0{i + 1}</span>
                <span className="text-3xl" aria-hidden="true">{p.icon}</span>
                <h3 className="mt-3 font-bold text-stone-800">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution ─────────────────────────────────────────────────────── */}
      <section id="solution" className="scroll-mt-20 bg-teal-50/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            kicker="Our solution"
            title="Wanderly fixes exactly those three things"
            subtitle="Each feature below maps to a pain point above — deliberately."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SOLUTIONS.map((s, i) => (
              <div key={s.title} className="card relative border-teal-100 p-6">
                <span className="absolute right-5 top-5 text-xs font-bold text-teal-200" aria-hidden="true">0{i + 1}</span>
                <span className="text-3xl" aria-hidden="true">{s.icon}</span>
                <h3 className="mt-3 font-bold text-stone-800">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{s.body}</p>
                <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-teal-600/10 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  ↓ {s.matches}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular destinations ─────────────────────────────────────────── */}
      <section id="destinations" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <SectionHeading
          kicker="Popular destinations"
          title="Where will you go next?"
          subtitle="Eight cities, from Himalayan foothills to Gulf skylines. Tap one to browse stays."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CITIES.map((c) => (
            <DestinationCard key={c.code} city={c} />
          ))}
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section id="contact" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-teal-600">Contact us</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-800">
                Talk to a human
              </h2>
              <p className="mt-3 max-w-md leading-relaxed text-stone-500">
                Questions about a booking, a feature idea, or just planning something unusual?
                Send us a note — a real person reads every message.
              </p>
              <dl className="mt-8 space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50" aria-hidden="true">✉️</span>
                  <div>
                    <dt className="text-stone-400">Email</dt>
                    <dd className="font-semibold text-stone-700">hello@wanderly.example</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50" aria-hidden="true">🕐</span>
                  <div>
                    <dt className="text-stone-400">Response time</dt>
                    <dd className="font-semibold text-stone-700">Within one business day</dd>
                  </div>
                </div>
              </dl>
            </div>
            <div className="card p-6 sm:p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
