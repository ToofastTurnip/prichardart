import { asset } from "@/lib/site";

const mediums = [
  {
    name: "Pastel",
    note: "Soft pastel on gray, tan and blue paper, where the tone of the sheet does part of the work. Used for birds, crabs, lighthouses, old cars and portraits, and often framed under glass.",
  },
  {
    name: "Oil",
    note: "Landscapes, farms, mills, boats and beaches, many finished in a reclaimed barnwood frame.",
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
          alt="An unfinished oil painting of a stone farmhouse on a wooden easel, with the reference photograph clipped above it"
          className="h-auto w-full border border-sand bg-paper object-cover shadow-sm"
        />
        <figcaption className="mt-3 text-sm text-ink-soft">
          <span className="font-serif text-base italic text-ink">Old Stone Farmhouse</span>, in progress on
          the studio easel with its reference photo clipped above.
        </figcaption>
      </figure>

      <div className="mt-14 lg:col-span-7 lg:mt-4">
        <h2 id="about-title" className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
          Ralph Prichard
        </h2>
        <div className="mt-8 max-w-[62ch] space-y-5 text-lg leading-relaxed text-ink">
          <p>
            I am a Maryland artist living on the Chesapeake Bay. I graduated as my high school
            class artist in 1971. My high school art teacher was David Turnbaugh, the renowned
            Maryland artist. Mr. Turnbaugh is the main reason I am still creating art today.
          </p>
          <p>
            I took a few night classes at Towson University and a local community college, but I
            am mostly self-taught. My career was demanding and I put my art supplies on the side
            for about 40 years. I retired in 2019 and started painting again.
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
