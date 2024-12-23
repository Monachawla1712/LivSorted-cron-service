export class Location {
  lat: number;
  long: number;
}

export class ZoneOrder {
  zone: string;
  location: Location;
  orderId: string;
}

export class RoutingRequest {
  origin: Location;
  riderCapacity: number;
  zoneOrders: ZoneOrder[];
}
