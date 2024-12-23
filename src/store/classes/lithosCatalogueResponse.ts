export class LithosCatalogueResponse {
  catalogueList: CatalogueData[];
}
export class CatalogueData {
  Id: number;
  Category: string;
  Item: string;
  SaleRate: number;
  Stock: number;
}
