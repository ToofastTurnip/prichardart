import { asset } from "@/lib/site";

const mediums = [
  {
    name: "Pastel",
    note: "Soft pastel on gray, tan and blue paper, where the tone of the sheet does part of the work. Used for birds, crabs, trucks and portraits.",
  },
  {
    name: "Watercolor",
    note: "Looser washes for old mills, farmhouses and seaside towns, often left with a ragged edge.",
  },
  {
    name: "Acrylic",
    note: "Canvas work for landscapes, boats and lighthouses, usually finished in a reclaimed barnwood frame.",
  },
];

export function Bio() {
  return (
    <section id="about" aria-labelledby="about-title" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28">
      <figure className="lg:col-span-5">
        <img
          src={asset("studio/stone-house-in-progress.webp")}
          width={1200}
          height={1600}
          loading="lazy"
          alt="An unfinished painting of a stone house on a wooden easel, with the reference photograph clipped above it"
          className="h-auto w-full border border-sand bg-paper object-cover shadow-sm"
        />
        <figcaption className="mt-3 text-sm text-ink-soft">
          <span className="font-serif text-base italic text-ink">Stone House</span>, in progress on
          the studio easel with its reference photo clipped above.
        </figcaption>
      </figure>

      <div className="mt-14 lg:col-span-7 lg:mt-4">
        <h2 id="about-title" className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
          About the artist
        </h2>
        <div className="mt-8 max-w-[62ch] space-y-5 text-lg leading-relaxed text-ink">
          <p>
            Prichard paints from a home studio in Middle River, a few minutes from the water on
            Maryland&rsquo;s side of the Chesapeake Bay. Most subjects come from close by: great blue
            herons working the shallows, workboats tied up at the pilings, blue crabs by the
            bushel, and the stone farmhouses and rusted trucks that still turn up on the back roads
            of Baltimore County.
          </p>
          <p>
            The work is slow on purpose. Feathers go down one stroke at a time, and rust is built
            up in layers the way it forms on real steel. A painting usually starts from a
            photograph clipped to the easel and gets worked until it can stand without it.
          </p>
          <p className="text-ink-soft">
            Commissions are open for boats, houses, pets and portraits painted from your own
            photographs.
          </p>
        </div>

        <h3 className="mt-14 font-serif text-2xl font-semibold">Mediums</h3>
        <dl className="mt-4 max-w-[62ch] divide-y divide-sand border-y border-sand">
          {mediums.map((m) => (
            <div key={m.name} className="grid gap-1 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <dt className="font-serif text-xl italic text-rust-text">{m.name}</dt>
              <dd className="text-ink-soft">{m.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
