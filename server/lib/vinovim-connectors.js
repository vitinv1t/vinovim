// Regista os conectores oficiais do VINOVIM uma única vez por instância.
import { registerConnector } from "./vinovim-addon.js";
import { tmdbConnector } from "./connectors/tmdb.js";
import { watchmodeConnector } from "./connectors/watchmode.js";

registerConnector(tmdbConnector);
registerConnector(watchmodeConnector);
