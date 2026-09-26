"use client";

import type { Coordinates } from "@/lib/types";
import { useEffect, useRef } from "react";

const DELHI: Coordinates = { lat: 28.6315, lng: 77.2167 };

export function LocationMap({
  center,
  pin,
  onPick,
}: {
  center?: Coordinates;
  pin?: Coordinates | null;
  onPick: (coordinates: Coordinates) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    (async () => {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;
      const L = "map" in leaflet.default ? leaflet.default : leaflet;
      const start = center ?? DELHI;
      map = L.map(node, { zoomControl: true }).setView([start.lat, start.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      const icon = L.divIcon({
        className: "",
        html: '<span style="display:block;width:16px;height:16px;margin-left:-8px;margin-top:-8px;border-radius:999px;background:#b76e79;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>',
        iconSize: [0, 0],
      });
      let marker = pin ? L.marker([pin.lat, pin.lng], { icon }).addTo(map) : undefined;
      map.on("click", (event) => {
        const next = { lat: event.latlng.lat, lng: event.latlng.lng };
        if (marker) marker.setLatLng(event.latlng);
        else marker = L.marker(event.latlng, { icon }).addTo(map!);
        onPickRef.current(next);
      });
      requestAnimationFrame(() => map?.invalidateSize());
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
    // Mount once; later pin updates are handled by clicks inside the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={host}
      className="h-52 w-full overflow-hidden rounded-xl border border-border"
      aria-label="Map"
    />
  );
}
