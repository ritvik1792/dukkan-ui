import { DELIVERY_RADIUS_KM } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-stone-600 md:grid-cols-4">
        <div>
          <p className="text-base font-semibold text-ink">Dukkan</p>
          <p className="mt-2 max-w-xs">
            A neighbourhood marketplace: Amazon-style catalogues, IndiaMART seller cards,
            Zepto-speed delivery inside a {DELIVERY_RADIUS_KM} km radius.
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">Buyers</p>
          <ul className="mt-2 space-y-1">
            <li>Nearby products</li>
            <li>Partner or shop delivery</li>
            <li>Orders & tracking</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">Sellers</p>
          <ul className="mt-2 space-y-1">
            <li>Upload catalogue</li>
            <li>Choose delivery mode</li>
            <li>GST-ready shop page</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">Coming next</p>
          <p className="mt-2">
            Spring Boot APIs, real geo, payments, and partner routing. This build is frontend
            only with mock data.
          </p>
        </div>
      </div>
    </footer>
  );
}
