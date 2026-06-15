import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type {
  ApiWeatherConfigResponse,
  ApiWeatherRefreshResponse,
  WeatherConfigDocument,
} from "@/features/settings/api/adminPlatformConfig.api.types";
import type { GeneralSettings } from "@/features/settings/api/settingsExtended.service";

export interface ApiFranchiseGeneralSettingsResponse {
  status?: string;
  settingKey?: string;
  document?: GeneralSettings;
}

export const franchiseSettingsService = {
  // Weather / Météo
  getWeather: () =>
    apiClient.get<ApiWeatherConfigResponse>(LINKS.franchise.settings.weatherConfig),

  updateWeather: (document: WeatherConfigDocument) =>
    apiClient.put<ApiWeatherConfigResponse>(LINKS.franchise.settings.weatherConfig, {
      document,
    }),

  refreshWeather: () =>
    apiClient.post<ApiWeatherRefreshResponse>(LINKS.franchise.settings.weatherRefresh, {}),

  // General / Paramètres généraux
  getGeneral: () =>
    apiClient.get<ApiFranchiseGeneralSettingsResponse>(LINKS.franchise.settings.general),

  updateGeneral: (document: GeneralSettings) =>
    apiClient.put<ApiFranchiseGeneralSettingsResponse>(LINKS.franchise.settings.general, {
      document,
    }),
};
