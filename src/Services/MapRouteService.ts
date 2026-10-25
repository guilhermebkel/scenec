import citiesData from "@/Data/cities.json" with { type: "json" };
import europeData from "@/Data/europe.json" with { type: "json" };
import type { MapCountry, RouteStop, RouteTransfer, TransportName } from "@/Protocols/MapProtocol.ts";
import type { RouteItem } from "@/Protocols/SceneProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { NormalizeUtil } from "@/Utils/NormalizeUtil.ts";
import { TransportUtil } from "@/Utils/TransportUtil.ts";

interface Route {
  stops: RouteStop[];
  transfers: RouteTransfer[];
}

export class MapRouteService {
  static readonly COUNTRIES: readonly MapCountry[] = europeData.countries;

  private static readonly NAME_TO_COUNTRY = new Map<string, MapCountry>(
    MapRouteService.COUNTRIES.flatMap((country): [string, MapCountry][] => [
      [NormalizeUtil.key(country.pt), country],
      [NormalizeUtil.key(country.name), country],
    ]),
  );

  private static readonly SPACES = /\s+/g;

  static countryNamed(name: string): MapCountry | undefined {
    return MapRouteService.NAME_TO_COUNTRY.get(NormalizeUtil.key(name));
  }

  static read(route: readonly RouteItem[], warnings: string[]): Route {
    const stops: RouteStop[] = [];
    const transfers: RouteTransfer[] = [];
    let pendingBy: TransportName | undefined;
    for (const item of route) {
      if (item.by) {
        pendingBy = MapRouteService.transportOf(item.by, warnings);
        continue;
      }
      const stop = MapRouteService.stopOf(item, warnings);
      if (!stop) {
        continue;
      }
      if (stops.length > 0) {
        transfers.push({ fromIndex: stops.length - 1, toIndex: stops.length, by: pendingBy ?? "car" });
        if (!pendingBy) {
          warnings.push(`leg to '${stop.city}' has no transport; used car (add '- {by: ...}')`);
        }
      }
      pendingBy = undefined;
      stops.push(stop);
    }
    if (stops.length < 2) {
      warnings.push("the route needs at least 2 cities");
    }
    return { stops, transfers };
  }

  private static transportOf(text: string, warnings: string[]): TransportName {
    const by = TransportUtil.parse(text);
    if (by) {
      return by;
    }
    warnings.push(`transport '${text}' is unknown (use plane, train, car, bus or boat)`);
    return "car";
  }

  private static firstText(...candidates: (string | undefined)[]): string {
    return candidates.find((candidate) => candidate) ?? "";
  }

  private static stopOf(item: RouteItem, warnings: string[]): RouteStop | null {
    const cityName = item.city ?? "";
    const key = NormalizeUtil.key(cityName).replace(MapRouteService.SPACES, "");
    const known = IdUtil.lookup(citiesData, key);
    const place = item.at ? { lon: item.at[0], lat: item.at[1], name: item.city } : known;
    if (!place) {
      warnings.push(`city '${item.city}' is not in the dictionary; set 'at: [lon, lat]'`);
      return null;
    }
    const country = item.country ? MapRouteService.countryNamed(item.country) : undefined;
    if (item.country && !country) {
      warnings.push(`country '${item.country}' not found on the map`);
    }
    return {
      lon: place.lon,
      lat: place.lat,
      city: MapRouteService.firstText(item.label, place.name, cityName),
      country: country ?? null,
    };
  }
}
